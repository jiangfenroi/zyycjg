
"use client"

import * as React from 'react'
import { Search, Loader2, Calendar as CalendarIcon, ClipboardCheck, FileDown } from 'lucide-react'
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
  const [isMounted, setIsMounted] = React.useState(false)

  const [followUpForm, setFollowUpForm] = React.useState({
    HFresult: '',
    SFTIME: '',
    SFSJ: '',
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
    setIsMounted(true)
    loadData()
  }, [loadData])

  React.useEffect(() => {
    if (selectedResult) {
      const storedUser = localStorage.getItem('currentUser');
      const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '操作员';
      setFollowUpForm(prev => ({ 
        ...prev, 
        SFTIME: new Date().toISOString().split('T')[0],
        SFSJ: new Date().toTimeString().slice(0, 5),
        SFGZRY: realName 
      }))
    }
  }, [selectedResult])

  const pendingResults = abnormalResults.filter(res => 
    !followUps.some(f => f.PERSONID === res.PERSONID && f.ZYYCJGTJBH === res.TJBHID)
  )

  const filteredPending = pendingResults.filter(res => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (res.PERSONNAME || '').toLowerCase().includes(searchLower) || 
      res.PERSONID.toLowerCase().includes(searchLower) || 
      (res.TJBHID || '').toLowerCase().includes(searchLower)
    )
  })

  const filteredCompleted = followUps.filter(f => {
    const searchLower = searchTerm.toLowerCase();
    const person = persons.find(p => p.PERSONID === f.PERSONID)
    return (
      (person?.PERSONNAME || '').toLowerCase().includes(searchLower) || 
      f.PERSONID.toLowerCase().includes(searchLower) || 
      (f.ZYYCJGTJBH || '').toLowerCase().includes(searchLower)
    )
  })

  const handleExportCompleted = () => {
    if (filteredCompleted.length === 0) return
    const headers = [
      "档案编号", "体检编号", "姓名", "性别", "年龄", "重要异常结果详情", 
      "回访结果详情", "是否复查及进一步病理检查", "回访日期", "回访时间", "回访人", "下次回访时间"
    ];
    const rows = filteredCompleted.map(f => {
      const person = persons.find(p => p.PERSONID === f.PERSONID);
      const result = abnormalResults.find(r => r.PERSONID === f.PERSONID && r.TJBHID === f.ZYYCJGTJBH);
      return [
        f.PERSONID, 
        f.ZYYCJGTJBH || '', 
        person?.PERSONNAME || '未知', 
        person?.SEX || '-', 
        person?.AGE || '-', 
        `"${(result?.ZYYCJGXQ || '').replace(/"/g, '""')}"`, 
        `"${(f.HFresult || '').replace(/"/g, '""')}"`, 
        f.jcsf ? '是' : '否', 
        f.SFTIME,
        f.SFSJ || '-',
        f.SFGZRY, 
        f.XCSFTIME || '-'
      ];
    });
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `随访记录表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: "报表导出成功" })
  }

  const handleCompleteTask = async () => {
    if (!selectedResult || !followUpForm.HFresult) {
      toast({ variant: "destructive", title: "校验失败", description: "请填写回访详情" })
      return
    }
    setSubmitting(true)
    try {
      const success = await DataService.addFollowUp({
        ID: `F${Date.now()}`,
        PERSONID: selectedResult.PERSONID,
        ZYYCJGTJBH: selectedResult.TJBHID,
        HFresult: followUpForm.HFresult,
        SFTIME: followUpForm.SFTIME,
        SFSJ: followUpForm.SFSJ,
        SFGZRY: followUpForm.SFGZRY,
        jcsf: followUpForm.jcsf,
        XCSFTIME: followUpForm.XCSFTIME
      })

      if (success) {
        toast({ title: "随访已结案" })
        setSelectedResult(null)
        loadData()
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!isMounted) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">随访结案管理</h1>
          <p className="text-muted-foreground mt-1">闭环业务质量监控</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="检索姓名、档案号..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <Tabs defaultValue="pending">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">待随访</TabsTrigger>
            <TabsTrigger value="completed">已结案</TabsTrigger>
          </TabsList>
          <TabsContent value="completed" className="mt-0">
             <Button variant="outline" size="sm" onClick={handleExportCompleted}>
               <FileDown className="mr-2 h-4 w-4" /> 导出记录
             </Button>
          </TabsContent>
        </div>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>姓名</TableHead>
                      <TableHead>体检编号</TableHead>
                      <TableHead className="min-w-[300px]">异常结果详情</TableHead>
                      <TableHead>登记时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : filteredPending.length > 0 ? filteredPending.map((res) => (
                      <TableRow key={res.ID} className="text-xs">
                        <TableCell className="font-bold">{res.PERSONNAME || '未知'}</TableCell>
                        <TableCell className="font-mono">{res.TJBHID || '-'}</TableCell>
                        <TableCell className="py-3">{res.ZYYCJGXQ}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{res.ZYYCJGTZRQ} {res.ZYYCJGTZSJ}</TableCell>
                        <TableCell className="text-right"><Button size="sm" onClick={() => setSelectedResult(res)}><ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> 随访</Button></TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">暂无待办任务</TableCell></TableRow>
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
                        <TableHead>姓名</TableHead>
                        <TableHead>回访结果摘要</TableHead>
                        <TableHead>随访日期</TableHead>
                        <TableHead>随访时间</TableHead>
                        <TableHead>随访人</TableHead>
                        <TableHead>下次回访</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompleted.map((f) => {
                        const person = persons.find(p => p.PERSONID === f.PERSONID)
                        return (
                          <TableRow key={f.ID} className="text-xs">
                            <TableCell className="font-medium">{person?.PERSONNAME || '未知'}</TableCell>
                            <TableCell className="max-w-[250px] truncate">{f.HFresult}</TableCell>
                            <TableCell className="font-mono">{f.SFTIME}</TableCell>
                            <TableCell className="font-mono">{f.SFSJ || '-'}</TableCell>
                            <TableCell>{f.SFGZRY}</TableCell>
                            <TableCell className="font-mono text-blue-600 font-bold">{f.XCSFTIME || '-'}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>随访结案登记</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-3 bg-muted/30 rounded text-xs space-y-1">
              <p>患者姓名：<span className="font-bold">{selectedResult?.PERSONNAME}</span></p>
              <p>异常结果：<span className="italic">"{selectedResult?.ZYYCJGXQ}"</span></p>
            </div>
            <div className="space-y-2">
              <Label>回访结果详情</Label>
              <Textarea placeholder="记录详细沟通内容..." className="min-h-[100px]" value={followUpForm.HFresult} onChange={e => setFollowUpForm({...followUpForm, HFresult: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2"><Label>回访日期</Label><Input type="date" value={followUpForm.SFTIME} onChange={e => setFollowUpForm({...followUpForm, SFTIME: e.target.value})} /></div>
               <div className="space-y-2"><Label>回访时间</Label><Input type="time" value={followUpForm.SFSJ} onChange={e => setFollowUpForm({...followUpForm, SFSJ: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="flex items-center space-x-2 pt-8">
                <Checkbox id="jcsf" checked={followUpForm.jcsf} onCheckedChange={(v) => setFollowUpForm({...followUpForm, jcsf: !!v})} />
                <Label htmlFor="jcsf" className="text-xs">是否复查及进一步病理检查</Label>
              </div>
              <div className="space-y-2">
                <Label>下次回访时间</Label>
                <Input type="date" value={followUpForm.XCSFTIME} onChange={e => setFollowUpForm({...followUpForm, XCSFTIME: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedResult(null)}>取消</Button>
            <Button onClick={handleCompleteTask} disabled={submitting}>提交结案</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
