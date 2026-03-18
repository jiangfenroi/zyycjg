
"use client"

import * as React from 'react'
import { Search, Phone, History, ExternalLink, Loader2, Calendar as CalendarIcon, CheckCircle2, AlertTriangle, Clock, FileText, Sparkles } from 'lucide-react'
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
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

  const filteredCompleted = followUps.filter(f => {
    const person = persons.find(p => p.PERSONID === f.PERSONID)
    return person?.PERSONNAME.includes(searchTerm) || f.PERSONID.includes(searchTerm)
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
        await DataService.updateFollowUpTaskStatus(selectedPersonId, 'completed')

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
          <p className="text-muted-foreground mt-1">闭环管理 A/B 类待随访任务及历史结案记录。</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="检索姓名、档案号..." className="pl-10 h-10 shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="pending">待处理任务 ({filteredPending.length})</TabsTrigger>
          <TabsTrigger value="completed">已结案记录 ({filteredCompleted.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card className="shadow-md border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                待执行随访任务
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[120px]">档案编号</TableHead>
                      <TableHead className="w-[120px]">体检编号</TableHead>
                      <TableHead className="w-[100px]">姓名</TableHead>
                      <TableHead className="w-[60px]">性别</TableHead>
                      <TableHead className="w-[60px]">年龄</TableHead>
                      <TableHead className="w-[120px]">联系电话</TableHead>
                      <TableHead className="w-[80px]">分类</TableHead>
                      <TableHead className="min-w-[250px]">异常结果详情</TableHead>
                      <TableHead className="w-[110px]">任务类型</TableHead>
                      <TableHead className="text-right sticky right-0 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={10} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : filteredPending.length > 0 ? filteredPending.map((pid) => {
                      const person = persons.find(p => p.PERSONID === pid)
                      const isScheduled = scheduledTasks.find(t => t.PERSONID === pid && t.XCSFTIME <= today)
                      const latestResult = abnormalResults.find(r => r.PERSONID === pid)
                      
                      return (
                        <TableRow key={pid} className="text-xs">
                          <TableCell className="font-mono">{pid}</TableCell>
                          <TableCell className="font-mono">{latestResult?.TJBHID || '-'}</TableCell>
                          <TableCell className="font-bold text-primary">
                            <Link href={`/patients/${pid}`} className="hover:underline">
                              {person?.PERSONNAME || '未知'}
                            </Link>
                          </TableCell>
                          <TableCell>{person?.SEX || '-'}</TableCell>
                          <TableCell>{person?.AGE || '-'}</TableCell>
                          <TableCell>{person?.PHONE || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={latestResult?.ZYYCJGFL === 'A' ? 'destructive' : 'secondary'}>
                              {latestResult?.ZYYCJGFL || '-'}类
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate" title={latestResult?.ZYYCJGXQ}>
                            {latestResult?.ZYYCJGXQ || '无详细描述'}
                          </TableCell>
                          <TableCell>
                            {isScheduled ? (
                              <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">计划复查</Badge>
                            ) : (
                              <Badge variant="outline" className="text-primary bg-primary/5 border-primary/20">首次告知</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right sticky right-0 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                            <Button size="sm" onClick={() => setSelectedPersonId(pid)} className="h-8">登记随访</Button>
                          </TableCell>
                        </TableRow>
                      )
                    }) : (
                       <TableRow><TableCell colSpan={10} className="text-center py-24 text-muted-foreground italic">当前暂无待处理随访任务。</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <Card className="shadow-md">
             <CardHeader className="pb-3 border-b bg-muted/10">
               <CardTitle className="text-lg">已结案随访库 (全院同步)</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[120px]">档案编号</TableHead>
                        <TableHead className="w-[120px]">体检编号</TableHead>
                        <TableHead className="w-[100px]">姓名</TableHead>
                        <TableHead className="w-[60px]">性别</TableHead>
                        <TableHead className="w-[60px]">年龄</TableHead>
                        <TableHead className="w-[120px]">联系电话</TableHead>
                        <TableHead className="w-[80px]">分类</TableHead>
                        <TableHead className="min-w-[200px]">异常详情</TableHead>
                        <TableHead className="min-w-[250px]">随访结果</TableHead>
                        <TableHead className="w-[120px]">回访日期</TableHead>
                        <TableHead className="w-[100px]">回访医生</TableHead>
                        <TableHead className="w-[100px]">是否复查</TableHead>
                        <TableHead className="text-right sticky right-0 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompleted.length > 0 ? filteredCompleted.map((f) => {
                        const person = persons.find(p => p.PERSONID === f.PERSONID)
                        const relResult = abnormalResults.find(r => r.PERSONID === f.PERSONID)
                        return (
                          <TableRow key={f.ID} className="text-xs">
                            <TableCell className="font-mono">{f.PERSONID}</TableCell>
                            <TableCell className="font-mono">{relResult?.TJBHID || '-'}</TableCell>
                            <TableCell className="font-semibold">{person?.PERSONNAME || '未知'}</TableCell>
                            <TableCell>{person?.SEX || '-'}</TableCell>
                            <TableCell>{person?.AGE || '-'}</TableCell>
                            <TableCell>{person?.PHONE || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={relResult?.ZYYCJGFL === 'A' ? 'destructive' : 'secondary'}>
                                {relResult?.ZYYCJGFL || '-'}类
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={relResult?.ZYYCJGXQ}>{relResult?.ZYYCJGXQ}</TableCell>
                            <TableCell className="max-w-[300px] truncate" title={f.HFresult}>{f.HFresult}</TableCell>
                            <TableCell className="font-mono text-muted-foreground">{f.SFTIME}</TableCell>
                            <TableCell>{f.SFGZRY}</TableCell>
                            <TableCell>
                              {f.jcsf ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200">已执行</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">未执行</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right sticky right-0 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                                <Button variant="ghost" size="sm" asChild className="h-8">
                                  <Link href={`/patients/${f.PERSONID}`}>查看详情</Link>
                                </Button>
                            </TableCell>
                          </TableRow>
                        )
                      }) : (
                        <TableRow><TableCell colSpan={13} className="text-center py-24 text-muted-foreground italic">暂无历史结案记录。</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedPersonId} onOpenChange={(open) => !open && setSelectedPersonId(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              随访结论登记 - {persons.find(p => p.PERSONID === selectedPersonId)?.PERSONNAME}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="p-3 bg-muted/30 rounded border border-dashed border-primary/20 space-y-1">
              <Label className="text-[10px] text-muted-foreground uppercase font-bold">关联异常详情</Label>
              <p className="text-xs text-foreground italic leading-relaxed">
                {abnormalResults.find(r => r.PERSONID === selectedPersonId)?.ZYYCJGXQ || '无详细异常描述记录'}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-primary">随访结果摘要 (回访记录)</Label>
              <Textarea 
                className="min-h-[120px] shadow-inner" 
                placeholder="详细记录回访沟通过程、患者反馈及目前健康状况..." 
                value={followUpForm.HFresult}
                onChange={e => setFollowUpForm({...followUpForm, HFresult: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label>回访日期</Label>
                  <Input type="date" value={followUpForm.SFTIME} onChange={e => setFollowUpForm({...followUpForm, SFTIME: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <Label>回访医生/工号</Label>
                  <Input value={followUpForm.SFGZRY} onChange={e => setFollowUpForm({...followUpForm, SFGZRY: e.target.value})} />
               </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-5">
              <div className="flex items-center space-x-3">
                <Checkbox id="jcsf" checked={followUpForm.jcsf} onCheckedChange={(v) => setFollowUpForm({...followUpForm, jcsf: !!v})} className="h-5 w-5" />
                <Label htmlFor="jcsf" className="cursor-pointer font-bold text-sm text-primary">患者已执行复查/进一步检查 (标记闭环完成)</Label>
              </div>
              <div className="space-y-2.5 border-t border-primary/10 pt-4">
                <Label className="text-primary text-xs flex items-center gap-2 font-bold">
                  <CalendarIcon className="h-3.5 w-3.5" /> 预设下次随访日期 (计划复查任务)
                </Label>
                <Input 
                  type="date" 
                  className="bg-white border-primary/30"
                  value={followUpForm.XCSFTIME} 
                  onChange={e => setFollowUpForm({...followUpForm, XCSFTIME: e.target.value})} 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPersonId(null)}>取消</Button>
            <Button onClick={handleCompleteTask} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "同步写入数据库"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
