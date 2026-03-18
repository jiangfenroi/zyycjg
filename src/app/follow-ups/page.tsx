"use client"

import * as React from 'react'
import { Search, Phone, History, ExternalLink, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
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
import { Person, AbnormalResult, FollowUp } from '@/lib/types'

export default function FollowUpsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [persons, setPersons] = React.useState<Person[]>([])
  const [abnormalResults, setAbnormalResults] = React.useState<AbnormalResult[]>([])
  const [followUps, setFollowUps] = React.useState<FollowUp[]>([])
  const [selectedPersonId, setSelectedPersonId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  const [followUpForm, setFollowUpForm] = React.useState({
    HFresult: '',
    SFTIME: new Date().toISOString().split('T')[0],
    SFGZRY: '',
    jcsf: false
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [p, r, f] = await Promise.all([
        DataService.getPatients(),
        DataService.getAbnormalResults(),
        DataService.getFollowUps()
      ])
      setPersons(p)
      setAbnormalResults(r)
      setFollowUps(f)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadData()
  }, [])

  // 待随访 = 有异常结果但没有随访记录的患者
  const pendingTasks = abnormalResults.filter(res => 
    !followUps.some(f => f.PERSONID === res.PERSONID)
  )

  const filteredPending = pendingTasks.filter(task => {
    const person = persons.find(p => p.PERSONID === task.PERSONID)
    return person?.PERSONNAME.includes(searchTerm) || task.PERSONID.includes(searchTerm)
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
      ...followUpForm
    }

    const success = await DataService.addFollowUp(newFollowUp)
    if (success) {
      toast({ title: "随访已记录", description: "该案例已正式进入已完成库。" })
      setSelectedPersonId(null)
      loadData()
      setFollowUpForm({ HFresult: '', SFTIME: new Date().toISOString().split('T')[0], SFGZRY: '', jcsf: false })
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">异常结果随访</h1>
        <p className="text-muted-foreground mt-1">闭环管理危急值随访任务，确保医疗质量安全。</p>
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
              <CardTitle className="text-lg">待随访列表</CardTitle>
              <CardDescription>系统实时匹配的尚未进行随访闭环的异常案例。</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>患者信息</TableHead>
                    <TableHead className="w-[300px]">关联异常详情</TableHead>
                    <TableHead className="w-[200px]">既往处置建议</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : filteredPending.length > 0 ? filteredPending.map((task) => {
                    const person = persons.find(p => p.PERSONID === task.PERSONID)
                    return (
                      <TableRow key={task.ID}>
                        <TableCell>
                          <div className="space-y-1">
                            <Link href={`/patients/${task.PERSONID}`} className="font-bold text-primary hover:underline flex items-center gap-1">
                              {person?.PERSONNAME} <ExternalLink className="h-3 w-3" />
                            </Link>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" /> {person?.PHONE}
                            </div>
                            <Badge variant={task.ZYYCJGFL === 'A' ? 'destructive' : 'secondary'} className="text-[10px]">
                              {task.ZYYCJGFL}类异常
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                           <div className="text-xs bg-muted/30 p-2 rounded border border-dashed">
                             <div className="flex items-start gap-1 mb-1">
                               <AlertCircle className="h-3 w-3 mt-0.5 text-destructive" />
                               <span className="font-semibold">详情：</span>
                             </div>
                             <p className="line-clamp-2 text-muted-foreground">{task.ZYYCJGXQ}</p>
                           </div>
                        </TableCell>
                        <TableCell><p className="text-xs text-primary italic">{task.ZYYCJGCZYJ}</p></TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => setSelectedPersonId(task.PERSONID)}>登记随访</Button>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                     <TableRow><TableCell colSpan={4} className="text-center py-12 opacity-50">暂无待执行的随访任务。</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
             <CardHeader className="pb-3"><CardTitle className="text-lg">已完成记录库</CardTitle></CardHeader>
             <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>完成日期</TableHead>
                      <TableHead>患者姓名</TableHead>
                      <TableHead>随访摘要</TableHead>
                      <TableHead>状态</TableHead>
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
                           <TableCell><div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" /> 已结案</div></TableCell>
                           <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                 <Link href={`/patients/${f.PERSONID}?tab=followup`}>查看病历</Link>
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
              <Label>回访详细结果</Label>
              <Textarea 
                className="min-h-[120px]" 
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
            <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
              <Checkbox id="further" checked={followUpForm.jcsf} onCheckedChange={(v) => setFollowUpForm({...followUpForm, jcsf: !!v})} />
              <Label htmlFor="further" className="cursor-pointer leading-none">是否已执行进一步病理/影像复查？</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPersonId(null)}>取消</Button>
            <Button onClick={handleCompleteTask} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "提交并结案"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
