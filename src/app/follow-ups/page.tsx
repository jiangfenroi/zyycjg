"use client"

import * as React from 'react'
import { Search, Phone, History, ExternalLink, AlertCircle, CheckCircle2, Loader2, Calendar as CalendarIcon } from 'lucide-react'
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
    XCSFTIME: '' // 下次随访日期
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
    } catch (err) {
      console.error("Failed to load data", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
    // 初始化当前登录人员
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

  // 待处理任务逻辑：
  // 1. 重要异常结果但尚未有随访记录的 (初始任务)
  // 2. 计划随访任务中，日期小于等于今天的 (定时任务)
  const today = new Date().toISOString().split('T')[0]
  
  const initialPending = abnormalResults.filter(res => 
    !followUps.some(f => f.PERSONID === res.PERSONID)
  )

  const activeScheduled = scheduledTasks.filter(task => 
    task.XCSFTIME <= today
  )

  // 合并唯一待办
  const pendingPersonIds = Array.from(new Set([
    ...initialPending.map(p => p.PERSONID),
    ...activeScheduled.map(p => p.PERSONID)
  ]))

  const filteredPending = pendingPersonIds.filter(id => {
    const person = persons.find(p => p.PERSONID === id)
    const personName = person?.PERSONNAME || '';
    return personName.includes(searchTerm) || id.includes(searchTerm)
  })

  const handleCompleteTask = async () => {
    if (!selectedPersonId || !followUpForm.HFresult) {
      toast({ variant: "destructive", title: "结案失败", description: "请填写随访结果摘要。" })
      return
    }

    setSubmitting(true)
    const newFollowUp: FollowUp = {
      ID: `F${Date.now()}`,
      PERSONID: selectedPersonId,
      HFresult: followUpForm.HFresult,
      SFTIME: followUpForm.SFTIME,
      SFGZRY: followUpForm.SFGZRY,
      jcsf: followUpForm.jcsf
    }

    try {
      // 1. 记录当次随访
      await DataService.addFollowUp(newFollowUp)
      
      // 2. 如果有计划随访任务，将其标记为已完成
      await DataService.updateFollowUpTaskStatus(selectedPersonId, 'completed')

      // 3. 如果设置了下一次随访日期，创建新任务
      if (followUpForm.XCSFTIME) {
        await DataService.addFollowUpTask({
          PERSONID: selectedPersonId,
          XCSFTIME: followUpForm.XCSFTIME,
          STATUS: 'pending'
        })
      }

      toast({ title: "随访已记录", description: followUpForm.XCSFTIME ? `已创建下次随访计划：${followUpForm.XCSFTIME}` : "该案例已结案。" })
      setSelectedPersonId(null)
      loadData()
      
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
      const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '';
      
      setFollowUpForm({ 
        HFresult: '', 
        SFTIME: new Date().toISOString().split('T')[0], 
        SFGZRY: realName, 
        jcsf: false,
        XCSFTIME: ''
      })
    } catch (err) {
      toast({ variant: "destructive", title: "操作失败", description: "数据库同步异常" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">重要异常结果随访</h1>
        <p className="text-muted-foreground mt-1">闭环管理重要异常随访任务，支持预设下次随访计划。</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">待执行随访 ({filteredPending.length})</TabsTrigger>
            <TabsTrigger value="completed">已结案记录 ({followUps.length})</TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="搜索姓名或编号..." 
              className="pl-8 h-9" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="pending">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">待处理列表</CardTitle>
              <CardDescription>包含初次随访任务及到达预设日期的计划随访任务。</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>患者信息</TableHead>
                    <TableHead className="w-[300px]">关联异常详情</TableHead>
                    <TableHead className="w-[120px]">任务类型</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : filteredPending.length > 0 ? filteredPending.map((pid) => {
                    const person = persons.find(p => p.PERSONID === pid)
                    const isScheduled = activeScheduled.find(t => t.PERSONID === pid)
                    const taskInfo = abnormalResults.find(r => r.PERSONID === pid)
                    
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
                           <div className="text-xs bg-muted/30 p-2 rounded border border-dashed">
                             <p className="line-clamp-2 text-muted-foreground">{taskInfo?.ZYYCJGXQ || '无异常明细记录'}</p>
                           </div>
                        </TableCell>
                        <TableCell>
                          {isScheduled ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">计划复查</Badge>
                              <span className="text-[9px] text-muted-foreground">到期日: {isScheduled.XCSFTIME}</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">初次告知</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => setSelectedPersonId(pid)}>登记随访</Button>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                     <TableRow><TableCell colSpan={4} className="text-center py-12 opacity-50 text-muted-foreground">暂无待执行的随访任务。</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
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
                           <TableCell className="text-xs">{f.SFTIME}</TableCell>
                           <TableCell className="font-medium">{person?.PERSONNAME || '未知'}</TableCell>
                           <TableCell className="max-w-[300px] truncate text-xs">{f.HFresult}</TableCell>
                           <TableCell>
                             <Badge variant={f.jcsf ? "default" : "outline"} className="text-[10px]">
                               {f.jcsf ? '已复查' : '未复查'}
                             </Badge>
                           </TableCell>
                           <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                 <Link href={`/patients/${f.PERSONID}?tab=followup`}>查看详情</Link>
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
            <DialogTitle>随访结果登记 - {persons.find(p => p.PERSONID === selectedPersonId)?.PERSONNAME}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>随访详细结果</Label>
              <Textarea 
                className="min-h-[100px]" 
                placeholder="记录随访沟通内容、患者康复情况或复查结果..." 
                value={followUpForm.HFresult}
                onChange={e => setFollowUpForm({...followUpForm, HFresult: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label>随访日期</Label>
                  <Input type="date" value={followUpForm.SFTIME} onChange={e => setFollowUpForm({...followUpForm, SFTIME: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <Label>随访人员</Label>
                  <Input placeholder="姓名" value={followUpForm.SFGZRY} onChange={e => setFollowUpForm({...followUpForm, SFGZRY: e.target.value})} />
               </div>
            </div>
            
            <div className="space-y-2 border p-3 rounded-md bg-muted/20">
              <Label className="text-primary font-bold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" /> 下次随访计划 (可选)
              </Label>
              <Input 
                type="date" 
                value={followUpForm.XCSFTIME} 
                onChange={e => setFollowUpForm({...followUpForm, XCSFTIME: e.target.value})} 
                className="bg-white"
              />
              <p className="text-[10px] text-muted-foreground mt-1">设置后，系统将在该日期自动触发新的随访提醒任务。</p>
            </div>

            <div className="flex items-center space-x-2 border p-3 rounded-md">
              <Checkbox id="further" checked={followUpForm.jcsf} onCheckedChange={(v) => setFollowUpForm({...followUpForm, jcsf: !!v})} />
              <Label htmlFor="further" className="cursor-pointer leading-none font-semibold">复查情况：已执行进一步病理/影像复查</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPersonId(null)}>取消</Button>
            <Button onClick={handleCompleteTask} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "确认提交并结案"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
