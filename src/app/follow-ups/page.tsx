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
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '操作员';
      setFollowUpForm(prev => ({ ...prev, SFTIME: new Date().toISOString().split('T')[0], SFGZRY: realName }))
    }
  }, [loadData])

  // A/B类均为重要异常，均列入待处理任务
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
      "回访结果详情", "是否复查及进一步病理检查", "回访时间", "回访人", "下次回访时间"
    ];
    const rows = filteredCompleted.map(f => {
      const person = persons.find(p => p.PERSONID === f.PERSONID);
      const result = abnormalResults.find(r => r.PERSONID === f.PERSONID && r.TJBHID === f.ZYYCJGFL);
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
        f.SFGZRY, 
        f.XCSFTIME || '-'
      ];
    });
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `重要异常已随访记录表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: "随访报表导出成功", description: "已生成符合 Excel 标准的随访记录文件。" })
  }

  const handleCompleteTask = async () => {
    if (!selectedResult || !followUpForm.HFresult) {
      toast({ variant: "destructive", title: "校验失败", description: "请填写回访详细结果" })
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
        SFGZRY: followUpForm.SFGZRY,
        jcsf: followUpForm.jcsf,
        XCSFTIME: followUpForm.XCSFTIME
      })

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

  if (!isMounted) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">重要异常结果随访管理</h1>
          <p className="text-muted-foreground mt-1">闭环业务流程监控</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="检索姓名、档案号、体检号..." className="pl-10 h-10 shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <Tabs defaultValue="pending">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-[400px] grid-cols-2 p-1 bg-muted/50 rounded-lg">
            <TabsTrigger value="pending" className="rounded-md">待随访任务</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-md">已回访记录</TabsTrigger>
          </TabsList>
          <TabsContent value="completed" className="mt-0">
             <Button variant="outline" size="sm" onClick={handleExportCompleted}>
               <FileDown className="mr-2 h-4 w-4" /> 导出回访记录
             </Button>
          </TabsContent>
        </div>

        <TabsContent value="pending" className="mt-6">
          <Card className="border-none shadow-md overflow-hidden">
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-bold">体检编号</TableHead>
                      <TableHead className="text-xs font-bold">姓名</TableHead>
                      <TableHead className="text-xs font-bold">电话</TableHead>
                      <TableHead className="min-w-[300px] text-xs font-bold">重要异常结果详情</TableHead>
                      <TableHead className="text-xs font-bold">通知日期</TableHead>
                      <TableHead className="text-xs font-bold">处置建议</TableHead>
                      <TableHead className="text-right text-xs font-bold pr-6">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : filteredPending.length > 0 ? filteredPending.map((res) => (
                      <TableRow key={res.ID} className="text-xs hover:bg-muted/5 transition-colors">
                        <TableCell className="font-mono text-muted-foreground">{res.TJBHID || '-'}</TableCell>
                        <TableCell className="font-bold text-primary">{res.PERSONNAME || '未知'}</TableCell>
                        <TableCell>{res.PHONE || '-'}</TableCell>
                        <TableCell className="max-w-[300px] whitespace-normal leading-relaxed py-4" title={res.ZYYCJGXQ}>{res.ZYYCJGXQ}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{res.ZYYCJGTZRQ}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={res.ZYYCJGCZYJ}>{res.ZYYCJGCZYJ}</TableCell>
                        <TableCell className="text-right pr-6"><Button size="sm" onClick={() => setSelectedResult(res)} className="h-8"><ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> 登记随访</Button></TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={7} className="text-center py-24 text-muted-foreground italic">无待处理随访任务</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <Card className="border-none shadow-md overflow-hidden">
             <CardContent className="p-0">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-bold">档案编号</TableHead>
                        <TableHead className="text-xs font-bold">体检编号</TableHead>
                        <TableHead className="text-xs font-bold">姓名</TableHead>
                        <TableHead className="text-xs font-bold">性别</TableHead>
                        <TableHead className="text-xs font-bold">年龄</TableHead>
                        <TableHead className="min-w-[250px] text-xs font-bold">重要异常结果详情</TableHead>
                        <TableHead className="min-w-[250px] text-xs font-bold">回访结果详情</TableHead>
                        <TableHead className="text-xs font-bold">是否复查及进一步病理检查</TableHead>
                        <TableHead className="text-xs font-bold">回访时间</TableHead>
                        <TableHead className="text-xs font-bold">回访人</TableHead>
                        <TableHead className="text-xs font-bold">下次回访时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompleted.map((f) => {
                        const person = persons.find(p => p.PERSONID === f.PERSONID)
                        const result = abnormalResults.find(r => r.PERSONID === f.PERSONID && r.TJBHID === f.ZYYCJGTJBH)
                        return (
                          <TableRow key={f.ID} className="text-xs hover:bg-muted/5 transition-colors">
                            <TableCell className="font-mono text-muted-foreground">{f.PERSONID}</TableCell>
                            <TableCell className="font-mono text-muted-foreground">{f.ZYYCJGTJBH || '-'}</TableCell>
                            <TableCell className="font-bold text-primary">{person?.PERSONNAME || '未知'}</TableCell>
                            <TableCell>{person?.SEX || '-'}</TableCell>
                            <TableCell>{person?.AGE || '-'}</TableCell>
                            <TableCell className="max-w-[250px] whitespace-normal leading-relaxed py-4" title={result?.ZYYCJGXQ}>{result?.ZYYCJGXQ}</TableCell>
                            <TableCell className="max-w-[250px] whitespace-normal leading-relaxed py-4" title={f.HFresult}>{f.HFresult}</TableCell>
                            <TableCell>
                              {f.jcsf ? (
                                <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] hover:bg-green-50">是</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">否</Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">{f.SFTIME}</TableCell>
                            <TableCell className="font-medium">{f.SFGZRY}</TableCell>
                            <TableCell className="font-mono text-blue-600 font-bold">{f.XCSFTIME || '-'}</TableCell>
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
        <DialogContent className="max-w-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              随访结果登记
              <span className="text-xs font-normal text-muted-foreground ml-2">档案号: {selectedResult?.PERSONID}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">患者姓名：<span className="text-foreground font-bold">{selectedResult?.PERSONNAME}</span></span>
                <span className="text-muted-foreground">体检编号：<span className="text-foreground font-mono">{selectedResult?.TJBHID}</span></span>
              </div>
              <div className="pt-2 border-t border-primary/10">
                <span className="text-muted-foreground">异常详情：</span>
                <p className="mt-1 text-foreground leading-relaxed italic">"{selectedResult?.ZYYCJGXQ}"</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">回访结果详情</Label>
              <Textarea placeholder="请详细记录回访沟通结论、患者反馈及后续处理方案..." className="min-h-[120px] shadow-sm" value={followUpForm.HFresult} onChange={e => setFollowUpForm({...followUpForm, HFresult: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2"><Label>回访日期</Label><Input type="date" value={followUpForm.SFTIME} onChange={e => setFollowUpForm({...followUpForm, SFTIME: e.target.value})} /></div>
               <div className="space-y-2"><Label>回访人</Label><Input value={followUpForm.SFGZRY} onChange={e => setFollowUpForm({...followUpForm, SFGZRY: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="flex items-center space-x-2 p-3 bg-green-50/50 rounded-md border border-green-100">
                <Checkbox id="jcsf" checked={followUpForm.jcsf} onCheckedChange={(v) => setFollowUpForm({...followUpForm, jcsf: !!v})} />
                <Label htmlFor="jcsf" className="cursor-pointer font-bold text-green-800 text-xs">是否复查及进一步病理检查</Label>
              </div>
              <div className="space-y-2">
                <Label className="text-blue-700 font-bold">下次回访时间</Label>
                <Input type="date" className="border-blue-200 bg-blue-50/20" value={followUpForm.XCSFTIME} onChange={e => setFollowUpForm({...followUpForm, XCSFTIME: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setSelectedResult(null)}>取消</Button>
            <Button onClick={handleCompleteTask} disabled={submitting} className="min-w-[120px]">
              {submitting ? <Loader2 className="animate-spin" /> : "同步存入中心库"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}