
"use client"

import * as React from 'react'
import { Search, Phone, History, ExternalLink, Loader2, Calendar as CalendarIcon, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { DataService } from '@/services/data-service'
import { Person, AbnormalResult, FollowUp, FollowUpTask } from '@/lib/types'

export default function FollowUpsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [persons, setPersons] = React.useState<Person[]>([])
  const [abnormalResults, setAbnormalResults] = React.useState<AbnormalResult[]>([])
  const [followUps, setFollowUps] = React.useState<FollowUp[]>([])
  const [scheduledTasks, setScheduledTasks] = React.useState<FollowUpTask[]>([])
  const [selectedPersonId, setSelectedPersonId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  const [followUpForm, setFollowUpForm] = React.useState({
    HFresult: '',
    SFTIME: '',
    SFGZRY: '',
    jcsf: false,
    XCSFTIME: '' 
  })

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [p, r, f, t] = await Promise.all([
        DataService.getPatients(),
        DataService.getAbnormalResults(),
        DataService.getFollowUps(),
        DataService.getFollowUpTasks('pending')
      ])
      setPersons(p)
      setAbnormalResults(r)
      setFollowUps(f)
      setScheduledTasks(t)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '系统操作员';
      
      setFollowUpForm(prev => ({
        ...prev,
        SFTIME: new Date().toISOString().split('T')[0],
        SFGZRY: realName
      }))
    }
  }, [loadData])

  // 待处理任务逻辑：
  // 1. 初次告知：未随访过的 A 类结果
  // 2. 计划复查：预设日期 <= 今天的任务
  const today = new Date().toISOString().split('T')[0]
  
  const initialPendingIds = abnormalResults
    .filter(res => res.ZYYCJGFL === 'A' && !followUps.some(f => f.PERSONID === res.PERSONID))
    .map(r => r.PERSONID)

  const scheduledPendingIds = scheduledTasks
    .filter(task => task.XCSFTIME <= today)
    .map(t => t.PERSONID)

  const pendingPersonIds = Array.from(new Set([...initialPendingIds, ...scheduledPendingIds]))

  const filteredPending = pendingPersonIds.filter(id => {
    const person = persons.find(p => p.PERSONID === id)
    return person?.PERSONNAME.includes(searchTerm) || id.includes(searchTerm)
  })

  const handleCompleteTask = async () => {
    if (!selectedPersonId || !followUpForm.HFresult) {
      toast({ variant: "destructive", title: "校验失败", description: "请填写随访详细结果摘要。" })
      return
    }

    setSubmitting(true)
    try {
      const newFollowUp: FollowUp = {
        ID: `F${Date.now()}`,
        PERSONID: selectedPersonId,
        HFresult: followUpForm.HFresult,
        SFTIME: followUpForm.SFTIME,
        SFGZRY: followUpForm.SFGZRY,
        jcsf: followUpForm.jcsf
      }

      const success = await DataService.addFollowUp(newFollowUp)
      if (success) {
        // 更新任务状态
        await DataService.updateFollowUpTaskStatus(selectedPersonId, 'completed')

        // 如果预设了下次日期，创建新任务
        if (followUpForm.XCSFTIME) {
          await DataService.addFollowUpTask({
            PERSONID: selectedPersonId,
            XCSFTIME: followUpForm.XCSFTIME,
            STATUS: 'pending'
          })
        }

        toast({ title: "随访已入库", description: followUpForm.XCSFTIME ? `已预设下次复查日期: ${followUpForm.XCSFTIME}` : "该病例已正式结案。" })
        setSelectedPersonId(null)
        loadData()
        
        // 重置表单
        const storedUser = localStorage.getItem('currentUser');
        const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '系统操作员';
        setFollowUpForm({ 
          HFresult: '', 
          SFTIME: new Date().toISOString().split('T')[0], 
          SFGZRY: realName, 
          jcsf: false,
          XCSFTIME: ''
        })
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "数据库同步失败", description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">重要异常结果随访</h1>
          <p className="text-muted-foreground mt-1">闭环管理待执行随访任务及历史结案记录。</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="检索姓名或档案号..." className="pl-10 h-10 shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="pending">待处理任务 ({filteredPending.length})</TabsTrigger>
          <TabsTrigger value="completed">已结案记录 ({followUps.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card className="shadow-md border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                待执行任务列表
              </CardTitle>
              <CardDescription>包含 A 类初次告知任务及预设日期已届满的复查提醒。</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>患者详情</TableHead>
                    <TableHead className="w-[350px]">关联异常详情</TableHead>
                    <TableHead>任务属性</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : filteredPending.length > 0 ? filteredPending.map((pid) => {
                    const person = persons.find(p => p.PERSONID === pid)
                    const isScheduled = scheduledTasks.find(t => t.PERSONID === pid && t.XCSFTIME <= today)
                    const latestResult = abnormalResults.find(r => r.PERSONID === pid)
                    
                    return (
                      <TableRow key={pid}>
                        <TableCell>
                          <div className="space-y-1">
                            <Link href={`/patients/${pid}`} className="font-bold text-primary hover:underline flex items-center gap-1">
                              {person?.PERSONNAME || '未知姓名'} <ExternalLink className="h-3 w-3" />
                            </Link>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" /> {person?.PHONE || '无电话'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                           <div className="text-xs text-muted-foreground line-clamp-2 italic bg-muted/30 p-2 rounded border border-dashed border-primary/20">
                             {latestResult?.ZYYCJGXQ || '无详细异常描述记录'}
                           </div>
                        </TableCell>
                        <TableCell>
                          {isScheduled ? (
                            <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                              <CalendarIcon className="h-3 w-3 mr-1.5" /> 计划复查
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-destructive bg-destructive/5 border-destructive/20">
                              <AlertTriangle className="h-3 w-3 mr-1.5" /> A类告知
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => setSelectedPersonId(pid)} className="shadow-sm">登记随访</Button>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                     <TableRow><TableCell colSpan={4} className="text-center py-24 text-muted-foreground italic">当前暂无待处理随访任务。</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <Card className="shadow-md">
             <CardHeader className="pb-3 border-b bg-muted/10">
               <CardTitle className="text-lg">全院已结案随访库</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>结案日期</TableHead>
                      <TableHead>患者姓名</TableHead>
                      <TableHead>随访结论摘要</TableHead>
                      <TableHead>复查状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {followUps.length > 0 ? followUps.map((f) => {
                       const person = persons.find(p => p.PERSONID === f.PERSONID)
                       return (
                        <TableRow key={f.ID}>
                           <TableCell className="text-xs font-mono text-muted-foreground">{f.SFTIME}</TableCell>
                           <TableCell className="font-semibold">{person?.PERSONNAME || '未知'}</TableCell>
                           <TableCell className="max-w-[400px] truncate text-xs" title={f.HFresult}>{f.HFresult}</TableCell>
                           <TableCell>
                             {f.jcsf ? (
                               <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 font-bold">已复查</Badge>
                             ) : (
                               <Badge variant="outline" className="text-muted-foreground font-normal">仅口头告知</Badge>
                             )}
                           </TableCell>
                           <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                 <Link href={`/patients/${f.PERSONID}`}>查看病历</Link>
                              </Button>
                           </TableCell>
                        </TableRow>
                       )
                    }) : (
                      <TableRow><TableCell colSpan={5} className="text-center py-24 text-muted-foreground italic">暂无历史结案记录。</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedPersonId} onOpenChange={(open) => !open && setSelectedPersonId(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              随访登记 - {persons.find(p => p.PERSONID === selectedPersonId)?.PERSONNAME}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label className="font-bold text-primary">随访结论摘要</Label>
              <Textarea 
                className="min-h-[140px] shadow-inner" 
                placeholder="请详细记录医患沟通内容、患者现病史康复状况或本次复查结果结论..." 
                value={followUpForm.HFresult}
                onChange={e => setFollowUpForm({...followUpForm, HFresult: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label>本次随访日期</Label>
                  <Input type="date" value={followUpForm.SFTIME} onChange={e => setFollowUpForm({...followUpForm, SFTIME: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <Label>经办医生/工号</Label>
                  <Input value={followUpForm.SFGZRY} onChange={e => setFollowUpForm({...followUpForm, SFGZRY: e.target.value})} />
               </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-5">
              <div className="flex items-center space-x-3">
                <Checkbox id="jcsf" checked={followUpForm.jcsf} onCheckedChange={(v) => setFollowUpForm({...followUpForm, jcsf: !!v})} className="h-5 w-5" />
                <Label htmlFor="jcsf" className="cursor-pointer font-bold text-sm text-primary">关键状态：患者已执行进一步病理或影像复查 (Closed Loop)</Label>
              </div>
              <div className="space-y-2.5 border-t border-primary/10 pt-4">
                <Label className="text-primary text-xs flex items-center gap-2 font-bold">
                  <CalendarIcon className="h-3.5 w-3.5" /> 预设下次随访日期 (计划任务)
                </Label>
                <Input 
                  type="date" 
                  className="bg-white border-primary/30"
                  value={followUpForm.XCSFTIME} 
                  onChange={e => setFollowUpForm({...followUpForm, XCSFTIME: e.target.value})} 
                />
                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> 设定后，系统将在该日期自动将患者推送至“待随访”列表。
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPersonId(null)}>取消</Button>
            <Button onClick={handleCompleteTask} disabled={submitting} className="min-w-[120px]">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "同步写入数据库"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
