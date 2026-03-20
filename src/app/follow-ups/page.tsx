
"use client"

import * as React from 'react'
import { Search, Loader2, ClipboardCheck, Eye, FileUp, X, CheckCircle2, RefreshCw, Calendar, Edit2 } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/tabs"
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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

const addMonths = (dateStr: string, months: number) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
};

export default function FollowUpsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [persons, setPersons] = React.useState<Person[]>([])
  const [abnormalResults, setAbnormalResults] = React.useState<AbnormalResult[]>([])
  const [followUps, setFollowUps] = React.useState<FollowUp[]>([])
  const [selectedResult, setSelectedResult] = React.useState<AbnormalResult | null>(null)
  const [editDateResult, setEditDateResult] = React.useState<AbnormalResult | null>(null)
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
    XCSFTIME: '',
    calculationBase: 'today' as 'today' | 'pedate'
  })

  const [newNextDate, setNewNextDate] = React.useState('')

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
        HFresult: '',
        SFTIME: new Date().toISOString().split('T')[0],
        SFSJ: new Date().toTimeString().slice(0, 5),
        SFGZRY: realName,
        XCSFTIME: '',
        jcsf: false,
        calculationBase: 'today'
      }))
      setSelectedFiles([])
      setUploadType('IMAGING')
    }
  }, [selectedResult])

  const today = new Date().toISOString().split('T')[0]

  const pendingResults = React.useMemo(() => abnormalResults.filter(res => {
    if (res.STATUS === 'deceased') return false;

    const recordFollowUps = followUps.filter(f => f.PERSONID === res.PERSONID && f.ZYYCJGTJBH === res.TJBHID);
    
    // 逻辑 1：初次随访或手动调整日期 (NEXT_DATE 优先)
    // 如果已经有过随访，则初次 T+7 逻辑失效
    const hasAnyFollowUp = recordFollowUps.length > 0;
    const initialTargetDate = res.NEXT_DATE || addYears(res.ZYYCJGTZRQ, 0); 
    const isInitialPending = !hasAnyFollowUp && initialTargetDate <= today;

    // 逻辑 2：年度复查 (T[体检日期] + 365)
    const peDate = DataService.getPEDateFromID(res.TJBHID || '', res.ZYYCJGTZRQ);
    const oneYearMark = addYears(peDate, 1);
    const hasAnnualFollowUp = recordFollowUps.some(f => f.SFTIME >= oneYearMark);
    const isAnnualPending = today >= oneYearMark && !hasAnnualFollowUp;

    return isInitialPending || isAnnualPending;
  }), [abnormalResults, followUps, today])

  const handleQuickDate = (months: number) => {
    if (!selectedResult) return;
    const baseDate = followUpForm.calculationBase === 'today' 
      ? today 
      : DataService.getPEDateFromID(selectedResult.TJBHID || '', selectedResult.ZYYCJGTZRQ);
    
    let resultDate = '';
    if (months === 12) {
      resultDate = addYears(baseDate, 1);
    } else {
      resultDate = addMonths(baseDate, months);
    }
    setFollowUpForm(prev => ({ ...prev, XCSFTIME: resultDate }));
  }

  const handleUpdateNextDate = async () => {
    if (!editDateResult || !newNextDate) return;
    setSubmitting(true);
    try {
      const success = await DataService.updateNextFollowUpDate(editDateResult.ID, newNextDate);
      if (success) {
        toast({ title: "随访计划已更新" });
        setEditDateResult(null);
        loadData(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

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
      // 如果录入了下次随访时间，同步更新主表的 NEXT_DATE
      if (followUpForm.XCSFTIME) {
        await DataService.updateNextFollowUpDate(selectedResult.ID, followUpForm.XCSFTIME);
      }

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
          <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-widest">临床路径驱动 · 死亡档案自动停办</p>
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
                      const peDate = DataService.getPEDateFromID(res.TJBHID || '', res.ZYYCJGTZRQ);
                      const oneYearMark = addYears(peDate, 1);
                      const isAnnual = today >= oneYearMark;
                      return (
                        <TableRow key={res.ID} className="text-xs">
                          <TableCell className="font-bold">{res.PERSONNAME || '未知'}</TableCell>
                          <TableCell className="font-mono text-destructive font-bold text-xs">
                            {isAnnual ? oneYearMark : (res.NEXT_DATE || '-')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isAnnual ? "destructive" : "secondary"} className="text-[10px]">
                              {isAnnual ? "年度复查" : "随访提醒"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 max-w-[250px] truncate" title={res.ZYYCJGXQ}>{res.ZYYCJGXQ}</TableCell>
                          <TableCell className="text-right flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="查看详情"><Link href={`/patients/${res.PERSONID}`}><Eye className="h-4 w-4" /></Link></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => {setEditDateResult(res); setNewNextDate(res.NEXT_DATE || today)}} title="调整日期"><Edit2 className="h-4 w-4" /></Button>
                            <Button size="sm" onClick={() => setSelectedResult(res)} className="h-8"><ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> 登记闭环</Button>
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

      {/* 修改随访计划日期弹窗 */}
      <Dialog open={!!editDateResult} onOpenChange={(open) => !open && setEditDateResult(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>调整随访计划日期</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>下次随访预定日期</Label>
              <Input type="date" value={newNextDate} onChange={e => setNewNextDate(e.target.value)} />
            </div>
            <p className="text-[10px] text-muted-foreground italic">修改后，任务预警时间将物理更新为新日期。</p>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setEditDateResult(null)}>取消</Button>
             <Button onClick={handleUpdateNextDate} disabled={submitting}>确认调整</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 随访结案弹窗 */}
      <Dialog open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>随访闭环结案登记</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
              <p>患者姓名：<span className="font-bold">{selectedResult?.PERSONNAME || '未知'}</span></p>
              <p>异常摘要：<span className="text-muted-foreground">"{selectedResult?.ZYYCJGXQ}"</span></p>
            </div>
            
            <div className="space-y-2">
              <Label>随访回访结果详情</Label>
              <Textarea placeholder="请详细记录与患者的沟通结果及处置方案..." className="min-h-[80px]" value={followUpForm.HFresult} onChange={e => setFollowUpForm({...followUpForm, HFresult: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/10">
               <div className="space-y-3">
                 <Label className="font-bold text-xs flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> 下次随访预定</Label>
                 <Input type="date" value={followUpForm.XCSFTIME} onChange={e => setFollowUpForm({...followUpForm, XCSFTIME: e.target.value})} />
                 <div className="flex flex-col gap-2">
                    <Label className="text-[10px] text-muted-foreground font-bold">计算基准</Label>
                    <RadioGroup value={followUpForm.calculationBase} onValueChange={v => setFollowUpForm({...followUpForm, calculationBase: v as any})} className="flex gap-4">
                       <div className="flex items-center space-x-2"><RadioGroupItem value="today" id="base-today" /><Label htmlFor="base-today" className="text-[10px]">当天</Label></div>
                       <div className="flex items-center space-x-2"><RadioGroupItem value="pedate" id="base-pe" /><Label htmlFor="base-pe" className="text-[10px]">体检日</Label></div>
                    </RadioGroup>
                 </div>
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] text-muted-foreground">快速选择周期</Label>
                 <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => handleQuickDate(1)}>1月后</Button>
                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => handleQuickDate(3)}>3月后</Button>
                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => handleQuickDate(6)}>半年后</Button>
                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => handleQuickDate(12)}>1年后</Button>
                 </div>
               </div>
            </div>

            <div className="p-4 border-2 border-dashed rounded-lg space-y-4 bg-muted/20">
              <div className="flex justify-between items-center">
                <Label className="font-bold flex items-center gap-2 text-xs"><FileUp className="h-4 w-4" /> 同步检查结果/病历附件</Label>
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
               <div className="space-y-2"><Label>本次结案日期</Label><Input type="date" value={followUpForm.SFTIME} onChange={e => setFollowUpForm({...followUpForm, SFTIME: e.target.value})} /></div>
               <div className="flex items-center space-x-2 pt-8">
                  <Checkbox id="jcsf" checked={followUpForm.jcsf} onCheckedChange={(v) => setFollowUpForm({...followUpForm, jcsf: !!v})} />
                  <Label htmlFor="jcsf" className="text-xs">标记为：已完成必要复查</Label>
               </div>
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
