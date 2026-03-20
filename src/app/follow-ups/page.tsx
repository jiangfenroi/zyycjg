
"use client"

import * as React from 'react'
import { Search, Loader2, ClipboardCheck, Eye, FileUp, X, CheckCircle2, RefreshCw, CalendarCheck } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { DataService } from '@/services/data-service'
import { Person, AbnormalResult, FollowUp } from '@/lib/types'
import Link from 'next/link'

const addYears = (dateStr: string, years: number) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().split('T')[0];
};

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

  const [selectedFiles, setSelectedFiles] = React.useState<{path: string, name: string}[]>([])
  const [uploadType, setUploadType] = React.useState<'IMAGING' | 'PATHOLOGY' | 'PE_REPORT'>('IMAGING')

  const [followUpForm, setFollowUpForm] = React.useState({
    HFresult: '',
    SFTIME: '',
    SFSJ: '',
    SFGZRY: '',
    jcsf: false,
    XCSFTIME: ''
  })

  const loadData = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
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
      if (!silent) setLoading(false)
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
      setSelectedFiles([])
      setUploadType('IMAGING')
    }
  }, [selectedResult])

  const today = new Date().toISOString().split('T')[0]

  // 待处理随访逻辑升级：包含 T+7 和年度复查逻辑
  const pendingResults = React.useMemo(() => abnormalResults.filter(res => {
    const recordFollowUps = followUps.filter(f => f.PERSONID === res.PERSONID && f.ZYYCJGTJBH === res.TJBHID);
    const hasInitialFollowUp = recordFollowUps.length > 0;
    const oneYearMark = addYears(res.ZYYCJGTZRQ, 1);
    const hasAnnualFollowUp = recordFollowUps.some(f => f.SFTIME >= oneYearMark);

    // 逻辑 A: 初始随访未做，且达到 T+7 时间点
    const isInitialPending = !hasInitialFollowUp && (res.NEXT_DATE && res.NEXT_DATE <= today);
    // 逻辑 B: 达到一年时间点，且该周年后未进行结案
    const isAnnualPending = today >= oneYearMark && !hasAnnualFollowUp;

    return isInitialPending || isAnnualPending;
  }), [abnormalResults, followUps, today])

  const filteredPending = React.useMemo(() => pendingResults.filter(res => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (res.PERSONNAME || '').toLowerCase().includes(searchLower) || 
      res.PERSONID.toLowerCase().includes(searchLower)
    )
  }), [pendingResults, searchTerm])

  const filteredCompleted = React.useMemo(() => followUps.filter(f => {
    const searchLower = searchTerm.toLowerCase();
    const person = persons.find(p => p.PERSONID === f.PERSONID)
    return (
      (person?.PERSONNAME || '').toLowerCase().includes(searchLower) || 
      f.PERSONID.toLowerCase().includes(searchLower)
    )
  }), [followUps, persons, searchTerm])

  const handleSelectFiles = async () => {
    const files = await DataService.selectLocalFiles(true);
    if (files && files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }

  const handleCompleteTask = async () => {
    if (!selectedResult || !followUpForm.HFresult) {
      toast({ variant: "destructive", title: "校验失败", description: "随访记录详情为必填项" })
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
        if (selectedFiles.length > 0) {
          for (const file of selectedFiles) {
            await DataService.uploadDocument(file.path, selectedResult.PERSONID, uploadType, followUpForm.SFTIME);
          }
        }
        toast({ title: "随访已结案" })
        setSelectedResult(null)
        loadData(true)
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
          <h1 className="text-3xl font-bold tracking-tight text-primary">随访闭环工作台</h1>
          <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-widest">临床路径驱动 · T+7 与年度复查双引擎</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => loadData()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <div className="relative w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="检索患者姓名..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">待处理任务 ({filteredPending.length})</TabsTrigger>
          <TabsTrigger value="completed">历史结案流水</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>患者</TableHead>
                      <TableHead className="text-destructive font-bold">触发预警时间</TableHead>
                      <TableHead>预警类型</TableHead>
                      <TableHead className="min-w-[250px]">异常详情</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && abnormalResults.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : filteredPending.length > 0 ? filteredPending.map((res) => {
                      const oneYearMark = addYears(res.ZYYCJGTZRQ, 1);
                      const isAnnual = today >= oneYearMark;
                      return (
                        <TableRow key={res.ID} className="text-xs">
                          <TableCell className="font-bold">{res.PERSONNAME || '未知'}</TableCell>
                          <TableCell className="font-mono text-destructive font-bold text-xs">
                            {isAnnual ? oneYearMark : (res.NEXT_DATE || '-')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isAnnual ? "destructive" : "secondary"} className="text-[10px]">
                              {isAnnual ? "年度复查" : "初次随访"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 max-w-[250px] truncate" title={res.ZYYCJGXQ}>{res.ZYYCJGXQ}</TableCell>
                          <TableCell className="text-right flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild><Link href={`/patients/${res.PERSONID}`}><Eye className="h-4 w-4" /></Link></Button>
                            <Button size="sm" onClick={() => setSelectedResult(res)}><ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> 登记闭环</Button>
                          </TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">目前暂无到期随访计划</TableCell></TableRow>
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
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>患者</TableHead>
                      <TableHead>回访结论</TableHead>
                      <TableHead>结案时间</TableHead>
                      <TableHead>经办人</TableHead>
                      <TableHead className="text-right">档案</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompleted.map((f) => {
                      const person = persons.find(p => p.PERSONID === f.PERSONID)
                      return (
                        <TableRow key={f.ID} className="text-xs">
                          <TableCell className="font-medium">{person?.PERSONNAME || '未知'}</TableCell>
                          <TableCell className="max-w-[400px] truncate">{f.HFresult}</TableCell>
                          <TableCell className="font-mono">{f.SFTIME} {f.SFSJ}</TableCell>
                          <TableCell>{f.SFGZRY}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild><Link href={`/patients/${f.PERSONID}`}><Eye className="h-4 w-4" /></Link></Button>
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

      <Dialog open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>随访闭环结案登记</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
              <p>患者姓名：<span className="font-bold">{selectedResult?.PERSONNAME || '未知'}</span></p>
              <p>异常摘要：<span className="text-muted-foreground">"{selectedResult?.ZYYCJGXQ}"</span></p>
            </div>
            <div className="space-y-2">
              <Label>随访回访结果详情</Label>
              <Textarea placeholder="请详细记录与患者的沟通结果及处置方案..." className="min-h-[100px]" value={followUpForm.HFresult} onChange={e => setFollowUpForm({...followUpForm, HFresult: e.target.value})} />
            </div>

            <div className="p-4 border-2 border-dashed rounded-lg space-y-4 bg-muted/20">
              <div className="flex justify-between items-center">
                <Label className="font-bold flex items-center gap-2 text-xs"><FileUp className="h-4 w-4" /> 同步检查结果/病历附件 (PDF)</Label>
                <div className="flex gap-2">
                   <Select value={uploadType} onValueChange={v => setUploadType(v as any)}>
                      <SelectTrigger className="h-8 w-24 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IMAGING">影像报告</SelectItem>
                        <SelectItem value="PATHOLOGY">病理报告</SelectItem>
                        <SelectItem value="PE_REPORT">体检报告</SelectItem>
                      </SelectContent>
                   </Select>
                   <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={handleSelectFiles}>选择文件</Button>
                </div>
              </div>
              {selectedFiles.length > 0 && (
                <div className="grid gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-background rounded border text-[10px]">
                      <span className="truncate flex-1 mr-2">{file.name}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}><X className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2"><Label>结案日期</Label><Input type="date" value={followUpForm.SFTIME} onChange={e => setFollowUpForm({...followUpForm, SFTIME: e.target.value})} /></div>
               <div className="space-y-2"><Label>结案时间</Label><Input type="time" value={followUpForm.SFSJ} onChange={e => setFollowUpForm({...followUpForm, SFSJ: e.target.value})} /></div>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-blue-50/50 rounded">
                <Checkbox id="jcsf" checked={followUpForm.jcsf} onCheckedChange={(v) => setFollowUpForm({...followUpForm, jcsf: !!v})} />
                <Label htmlFor="jcsf" className="text-xs text-blue-700">标记为：已完成计划要求的复查或病理检查</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedResult(null)}>取消</Button>
            <Button onClick={handleCompleteTask} disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              确认结案并同步中心库
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
