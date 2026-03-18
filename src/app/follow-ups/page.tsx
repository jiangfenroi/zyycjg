
"use client"

import * as React from 'react'
import { Search, Phone, History, ExternalLink, Loader2, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react'
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
      const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '';
      
      setFollowUpForm(prev => ({
        ...prev,
        SFTIME: new Date().toISOString().split('T')[0],
        SFGZRY: realName
      }))
    }
  }, [loadData])

  // 待执行逻辑：1. 未曾随访过的 A 类登记； 2. 已到达计划日期的复查任务
  const today = new Date().toISOString().split('T')[0]
  
  const initialPendingIds = abnormalResults
    .filter(res => !followUps.some(f => f.PERSONID === res.PERSONID))
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
      toast({ variant: "destructive", title: "校验失败", description: "请填写随访详细结果。" })
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

      await DataService.addFollowUp(newFollowUp)
      await DataService.updateFollowUpTaskStatus(selectedPersonId, 'completed')

      if (followUpForm.XCSFTIME) {
        await DataService.addFollowUpTask({
          PERSONID: selectedPersonId,
          XCSFTIME: followUpForm.XCSFTIME,
          STATUS: 'pending'
        })
      }

      toast({ title: "随访已记录", description: followUpForm.XCSFTIME ? "已预设下次随访计划。" : "该病例已正式结案。" })
      setSelectedPersonId(null)
      loadData()
      
      // 重置表单
      const storedUser = localStorage.getItem('currentUser');
      const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '';
      setFollowUpForm({ 
        HFresult: '', 
        SFTIME: new Date().toISOString().split('T')[0], 
        SFGZRY: realName, 
        jcsf: false,
        XCSFTIME: ''
      })
    } catch (err) {
      toast({ variant: "destructive", title: "数据库更新失败" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">重要异常结果随访</h1>
          <p className="text-muted-foreground mt-1">管理全院待执行随访任务及历史结案记录。</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索姓名或档案号..." className="pl-8 h-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="pending">待处理任务 ({filteredPending.length})</TabsTrigger>
          <TabsTrigger value="completed">已结案记录 ({followUps.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">待随访列表</CardTitle>
              <CardDescription>包含初次告知任务及预设日期已到的复查提醒。</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>患者详情</TableHead>
                    <TableHead className="w-[300px]">关联异常内容</TableHead>
                    <TableHead>任务分类</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : filteredPending.length > 0 ? filteredPending.map((pid) => {
                    const person = persons.find(p => p.PERSONID === pid)
                    const isScheduled = scheduledTasks.find(t => t.PERSONID === pid && t.XCSFTIME <= today)
                    const latestResult = abnormalResults.find(r => r.PERSONID === pid)
                    
                    return (
                      <TableRow key={pid}>
                        <TableCell>
                          <div className="space-y-1">
                            <Link href={`/patients/${pid}`} className="font-bold text-primary hover:underline flex items-center gap-1">
                              {person?.PERSONNAME || '未知'} <ExternalLink className="h-3 w-3" />
                            </Link>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" /> {person?.PHONE || '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                           <div className="text-xs text-muted-foreground line-clamp-2 italic bg-muted/20 p-2 rounded border border-dashed">
                             {latestResult?.ZYYCJGXQ || '无详细记录'}
                           </div>
                        </TableCell>
                        <TableCell>
                          {isScheduled ? (
                            <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                              <CalendarIcon className="h-3 w-3 mr-1" /> 计划复查
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                              初次告知 (A类)
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => setSelectedPersonId(pid)}>登记随访</Button>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                     <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">暂无待处理任务。</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <Card>
             <CardHeader className="pb-3"><CardTitle className="text-lg">已完成随访库</CardTitle></CardHeader>
             <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>完成日期</TableHead>
                      <TableHead>患者姓名</TableHead>
                      <TableHead>随访结果摘要</TableHead>
                      <TableHead>复查情况</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {followUps.map((f) => {
                       const person = persons.find(p => p.PERSONID === f.PERSONID)
                       return (
                        <TableRow key={f.ID}>
                           <TableCell className="text-xs font-mono">{f.SFTIME}</TableCell>
                           <TableCell className="font-medium">{person?.PERSONNAME || '未知'}</TableCell>
                           <TableCell className="max-w-[400px] truncate text-xs">{f.HFresult}</TableCell>
                           <TableCell>
                             {f.jcsf ? (
                               <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">已执行复查</Badge>
                             ) : (
                               <Badge variant="outline" className="text-muted-foreground">未复查</Badge>
                             )}
                           </TableCell>
                           <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                 <Link href={`/patients/${f.PERSONID}`}>查看详情</Link>
                              </Button>
                           </TableCell>
                        </TableRow>
                       )
                    })}
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
              <Label>随访详细结果摘要</Label>
              <Textarea 
                className="min-h-[120px]" 
                placeholder="记录沟通内容、患者康复状况或本次复查结果..." 
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
                  <Label>随访经办人</Label>
                  <Input value={followUpForm.SFGZRY} onChange={e => setFollowUpForm({...followUpForm, SFGZRY: e.target.value})} />
               </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="jcsf" checked={followUpForm.jcsf} onCheckedChange={(v) => setFollowUpForm({...followUpForm, jcsf: !!v})} />
                <Label htmlFor="jcsf" className="cursor-pointer font-bold">复查情况：患者已执行进一步病理或影像复查</Label>
              </div>
              <div className="space-y-2">
                <Label className="text-primary text-xs flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" /> 下次随访预设日期 (可选)
                </Label>
                <Input 
                  type="date" 
                  className="bg-white"
                  value={followUpForm.XCSFTIME} 
                  onChange={e => setFollowUpForm({...followUpForm, XCSFTIME: e.target.value})} 
                />
                <p className="text-[10px] text-muted-foreground italic">设置后，系统将在该日期自动触发新的随访提醒。</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPersonId(null)}>取消</Button>
            <Button onClick={handleCompleteTask} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "确认登记并结案"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
