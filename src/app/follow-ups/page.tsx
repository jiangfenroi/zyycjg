
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
  const [selectedResult, setSelectedResult] = React.useState<AbnormalResult | null>(null)
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

  // 待随访：A类和B类且尚未完成随访的
  const pendingResults = abnormalResults.filter(res => !followUps.some(f => f.PERSONID === res.PERSONID && f.ZYYCJGTJBH === res.TJBHID))

  const filteredPending = pendingResults.filter(res => {
    return (res.PERSONNAME || '').includes(searchTerm) || res.PERSONID.includes(searchTerm) || (res.TJBHID || '').includes(searchTerm)
  })

  const filteredCompleted = followUps.filter(f => {
    const person = persons.find(p => p.PERSONID === f.PERSONID)
    return (person?.PERSONNAME || '').includes(searchTerm) || f.PERSONID.includes(searchTerm) || (f.ZYYCJGTJBH || '').includes(searchTerm)
  })

  const handleCompleteTask = async () => {
    if (!selectedResult || !followUpForm.HFresult) {
      toast({ variant: "destructive", title: "校验失败", description: "请填写回访详细结果。" })
      return
    }
    setSubmitting(true)
    try {
      // 1. 保存随访信息 (SP_SF)
      const success = await DataService.addFollowUp({
        ID: `F${Date.now()}`,
        PERSONID: selectedResult.PERSONID,
        ZYYCJGTJBH: selectedResult.TJBHID,
        HFresult: followUpForm.HFresult,
        SFTIME: followUpForm.SFTIME,
        SFGZRY: followUpForm.SFGZRY,
        jcsf: followUpForm.jcsf
      })

      // 2. 如果填写了下次随访日期，保存任务 (SP_SFRW)
      if (success && followUpForm.XCSFTIME) {
        await DataService.addFollowUpTask({
          PERSONID: selectedResult.PERSONID,
          ZYYCJGTJBH: selectedResult.TJBHID,
          XCSFTIME: followUpForm.XCSFTIME,
          STATUS: 'pending'
        })
      }

      if (success) {
        toast({ title: "随访已存档" })
        setSelectedResult(null)
        loadData()
        setFollowUpForm(prev => ({ ...prev, HFresult: '', jcsf: false, XCSFTIME: '' }))
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
          <p className="text-muted-foreground mt-1">闭环管理 A/B 类待随访任务及回访记录。</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="检索姓名、档案号、体检号..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="pending">待随访任务 ({filteredPending.length})</TabsTrigger>
          <TabsTrigger value="completed">已回访记录 ({filteredCompleted.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">档案编号</TableHead>
                      <TableHead className="text-xs">体检编号</TableHead>
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
                      <TableRow><TableCell colSpan={8} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : filteredPending.length > 0 ? filteredPending.map((res) => {
                      return (
                        <TableRow key={res.ID} className="text-xs">
                          <TableCell className="font-mono">{res.PERSONID}</TableCell>
                          <TableCell className="font-mono">{res.TJBHID || '-'}</TableCell>
                          <TableCell className="font-bold text-primary">{res.PERSONNAME || '未知'}</TableCell>
                          <TableCell>{res.SEX || '-'}</TableCell>
                          <TableCell>{res.AGE || '-'}</TableCell>
                          <TableCell>{res.PHONE || '-'}</TableCell>
                          <TableCell className="max-w-[300px] truncate" title={res.ZYYCJGXQ}>{res.ZYYCJGXQ}</TableCell>
                          <TableCell className="text-right"><Button size="sm" onClick={() => setSelectedResult(res)}>登记随访</Button></TableCell>
                        </TableRow>
                      )
                    }) : (
                      <TableRow><TableCell colSpan={8} className="text-center py-24 text-muted-foreground italic">无待处理任务</TableCell></TableRow>
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
                        <TableHead className="text-xs">体检编号</TableHead>
                        <TableHead className="text-xs">姓名</TableHead>
                        <TableHead className="text-xs">性别</TableHead>
                        <TableHead className="text-xs">年龄</TableHead>
                        <TableHead className="text-xs">电话</TableHead>
                        <TableHead className="min-w-[200px] text-xs">重要异常结果详情</TableHead>
                        <TableHead className="min-w-[250px] text-xs">回访结果</TableHead>
                        <TableHead className="text-xs">是否进一步检查</TableHead>
                        <TableHead className="text-xs">回访日期</TableHead>
                        <TableHead className="text-xs">回访人</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompleted.map((f) => {
                        const person = persons.find(p => p.PERSONID === f.PERSONID)
                        const result = abnormalResults.find(r => r.PERSONID === f.PERSONID && r.TJBHID === f.ZYYCJGTJBH)
                        return (
                          <TableRow key={f.ID} className="text-xs">
                            <TableCell className="font-mono">{f.PERSONID}</TableCell>
                            <TableCell className="font-mono">{f.ZYYCJGTJBH || '-'}</TableCell>
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

      <Dialog open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>随访结果登记 (SP_SF)</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-3 bg-muted rounded text-xs italic space-y-1">
              <p>患者姓名：{selectedResult?.PERSONNAME}</p>
              <p>体检编号：{selectedResult?.TJBHID}</p>
              <p>异常摘要：{selectedResult?.ZYYCJGXQ}</p>
            </div>
            <div className="space-y-2">
              <Label>回访结果 (HFresult)</Label>
              <Textarea placeholder="记录详细回访结论..." value={followUpForm.HFresult} onChange={e => setFollowUpForm({...followUpForm, HFresult: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2"><Label>随访日期 (SFTIME)</Label><Input type="date" value={followUpForm.SFTIME} onChange={e => setFollowUpForm({...followUpForm, SFTIME: e.target.value})} /></div>
               <div className="space-y-2"><Label>随访人 (SFGZRY)</Label><Input value={followUpForm.SFGZRY} onChange={e => setFollowUpForm({...followUpForm, SFGZRY: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded border border-primary/20">
                <Checkbox id="jcsf" checked={followUpForm.jcsf} onCheckedChange={(v) => setFollowUpForm({...followUpForm, jcsf: !!v})} />
                <Label htmlFor="jcsf" className="cursor-pointer font-bold">是否进一步检查 (jcsf)</Label>
              </div>
              <div className="space-y-2">
                <Label>下次随访日期 (XCSFTIME)</Label>
                <Input type="date" value={followUpForm.XCSFTIME} onChange={e => setFollowUpForm({...followUpForm, XCSFTIME: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCompleteTask} disabled={submitting}>同步存入中心库</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
