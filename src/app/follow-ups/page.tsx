
"use client"

import * as React from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    SFTIME: '',
    SFGZRY: '',
    jcsf: false
  })

  const loadData = React.useCallback(async () => {
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
  }, [])

  React.useEffect(() => {
    loadData()
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '操作员';
      setFollowUpForm(prev => ({ ...prev, SFTIME: new Date().toISOString().split('T')[0], SFGZRY: realName }))
    }
  }, [loadData])

  const pendingPersonIds = Array.from(new Set(abnormalResults
    .filter(res => !followUps.some(f => f.PERSONID === res.PERSONID))
    .map(r => r.PERSONID)))

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
      toast({ variant: "destructive", title: "校验失败", description: "请填写回访详细结果。" })
      return
    }
    setSubmitting(true)
    try {
      const success = await DataService.addFollowUp({
        ID: `F${Date.now()}`,
        PERSONID: selectedPersonId,
        HFresult: followUpForm.HFresult,
        SFTIME: followUpForm.SFTIME,
        SFGZRY: followUpForm.SFGZRY,
        jcsf: followUpForm.jcsf
      })
      if (success) {
        toast({ title: "随访已存档" })
        setSelectedPersonId(null)
        loadData()
        setFollowUpForm(prev => ({ ...prev, HFresult: '', jcsf: false }))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">重要异常结果随访</h1>
          <p className="text-muted-foreground mt-1">管理 A/B 类待处理随访任务及历史记录。</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="检索姓名、档案号..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="pending">待随访任务 ({filteredPending.length})</TabsTrigger>
          <TabsTrigger value="completed">已结案记录 ({filteredCompleted.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">档案编号</TableHead>
                      <TableHead className="text-xs">姓名</TableHead>
                      <TableHead className="text-xs">性别</TableHead>
                      <TableHead className="text-xs">年龄</TableHead>
                      <TableHead className="text-xs">电话</TableHead>
                      <TableHead className="min-w-[300px] text-xs">重要异常结果详情</TableHead>
                      <TableHead className="text-right text-xs">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : filteredPending.length > 0 ? filteredPending.map((pid) => {
                      const person = persons.find(p => p.PERSONID === pid)
                      const result = abnormalResults.find(r => r.PERSONID === pid)
                      return (
                        <TableRow key={pid} className="text-xs">
                          <TableCell className="font-mono">{pid}</TableCell>
                          <TableCell className="font-bold text-primary">{person?.PERSONNAME || '未知'}</TableCell>
                          <TableCell>{person?.SEX || '-'}</TableCell>
                          <TableCell>{person?.AGE || '-'}</TableCell>
                          <TableCell>{person?.PHONE || '-'}</TableCell>
                          <TableCell className="max-w-[300px] truncate" title={result?.ZYYCJGXQ}>{result?.ZYYCJGXQ}</TableCell>
                          <TableCell className="text-right"><Button size="sm" onClick={() => setSelectedPersonId(pid)}>登记随访</Button></TableCell>
                        </TableRow>
                      )
                    }) : (
                      <TableRow><TableCell colSpan={7} className="text-center py-24 text-muted-foreground italic">无待处理任务</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <Card>
             <CardContent className="p-0">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs">档案编号</TableHead>
                        <TableHead className="text-xs">姓名</TableHead>
                        <TableHead className="text-xs">性别</TableHead>
                        <TableHead className="text-xs">年龄</TableHead>
                        <TableHead className="text-xs">电话</TableHead>
                        <TableHead className="min-w-[200px] text-xs">重要异常结果详情</TableHead>
                        <TableHead className="min-w-[250px] text-xs">回访结果</TableHead>
                        <TableHead className="text-xs">是否复查或进一步检查</TableHead>
                        <TableHead className="text-xs">回访日期</TableHead>
                        <TableHead className="text-xs">回访人</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompleted.map((f) => {
                        const person = persons.find(p => p.PERSONID === f.PERSONID)
                        const result = abnormalResults.find(r => r.PERSONID === f.PERSONID)
                        return (
                          <TableRow key={f.ID} className="text-xs">
                            <TableCell className="font-mono">{f.PERSONID}</TableCell>
                            <TableCell className="font-semibold">{person?.PERSONNAME || '未知'}</TableCell>
                            <TableCell>{person?.SEX || '-'}</TableCell>
                            <TableCell>{person?.AGE || '-'}</TableCell>
                            <TableCell>{person?.PHONE || '-'}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={result?.ZYYCJGXQ}>{result?.ZYYCJGXQ}</TableCell>
                            <TableCell className="max-w-[250px] truncate" title={f.HFresult}>{f.HFresult}</TableCell>
                            <TableCell>{f.jcsf ? <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">是</Badge> : <Badge variant="outline" className="text-[10px]">否</Badge>}</TableCell>
                            <TableCell className="font-mono text-muted-foreground">{f.SFTIME}</TableCell>
                            <TableCell>{f.SFGZRY}</TableCell>
                          </TableRow>
                        )
                      })}
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
          <DialogHeader><DialogTitle>随访结果登记</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-3 bg-muted rounded text-xs italic">
              异常摘要：{abnormalResults.find(r => r.PERSONID === selectedPersonId)?.ZYYCJGXQ || '无'}
            </div>
            <div className="space-y-2">
              <Label>回访结果</Label>
              <Textarea placeholder="记录详细回访结论..." value={followUpForm.HFresult} onChange={e => setFollowUpForm({...followUpForm, HFresult: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2"><Label>回访日期</Label><Input type="date" value={followUpForm.SFTIME} onChange={e => setFollowUpForm({...followUpForm, SFTIME: e.target.value})} /></div>
               <div className="space-y-2"><Label>回访人</Label><Input value={followUpForm.SFGZRY} onChange={e => setFollowUpForm({...followUpForm, SFGZRY: e.target.value})} /></div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded">
              <Checkbox id="jcsf" checked={followUpForm.jcsf} onCheckedChange={(v) => setFollowUpForm({...followUpForm, jcsf: !!v})} />
              <Label htmlFor="jcsf" className="cursor-pointer font-bold">已执行复查或进一步检查 (标记结案)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCompleteTask} disabled={submitting}>确认保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
