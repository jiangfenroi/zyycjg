
"use client"

import * as React from 'react'
import { Plus, Search, Eye, Loader2, RefreshCw, Edit2, UserPlus, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { AbnormalResult, Person } from '@/lib/types'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { DataService } from '@/services/data-service'
import Link from 'next/link'

const addDays = (dateStr: string, days: number) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export default function AbnormalResultsPage() {
  const { toast } = useToast()
  const [results, setResults] = React.useState<AbnormalResult[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [dialogStep, setDialogStep] = React.useState<'result' | 'patient'>('result')
  const [submitting, setSubmitting] = React.useState(false)
  const [editId, setEditId] = React.useState<string | null>(null)
  
  const [formData, setFormData] = React.useState<AbnormalResult>({
    ID: '',
    PERSONID: '',
    TJBHID: '',
    ZYYCJGXQ: '',
    ZYYCJGFL: 'A',
    ZYYCJGCZYJ: '', 
    ZYYCJGFKJG: '',
    ZYYCJGTZRQ: '',
    ZYYCJGTZSJ: '',
    WORKER: '',
    ZYYCJGBTZR: '',
    ZYYCJGJKXJ: true,
    NEXT_DATE: '',
    IS_NOTIFIED: true,
  })

  const [patientData, setPatientData] = React.useState<Partial<Person>>({
    PERSONNAME: '',
    SEX: '男',
    AGE: 0,
    PHONE: '',
    IDNO: ''
  })

  const loadData = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const resData = await DataService.getAbnormalResults()
      setResults(resData)
    } catch (err) {
      toast({ variant: "destructive", title: "数据同步异常", description: "无法从中心数据库获取最新流水" })
    } finally {
      if (!silent) setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleOpenAdd = () => {
    setEditId(null)
    setDialogStep('result')
    const storedUser = localStorage.getItem('currentUser');
    const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '操作员';
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);
    
    setFormData({
      ID: '',
      PERSONID: '',
      TJBHID: '',
      ZYYCJGXQ: '',
      ZYYCJGFL: 'A',
      ZYYCJGCZYJ: '', 
      ZYYCJGFKJG: '',
      ZYYCJGTZRQ: today,
      ZYYCJGTZSJ: nowTime,
      WORKER: realName,
      ZYYCJGBTZR: '',
      ZYYCJGJKXJ: true,
      NEXT_DATE: addDays(today, 7),
      IS_NOTIFIED: true
    })
    setPatientData({ PERSONNAME: '', SEX: '男', AGE: 0, PHONE: '', IDNO: '' })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (res: AbnormalResult) => {
    setEditId(res.ID)
    setDialogStep('result')
    setFormData({
      ...res,
      TJBHID: res.TJBHID || '',
      ZYYCJGCZYJ: res.ZYYCJGCZYJ || '', 
      ZYYCJGFKJG: res.ZYYCJGFKJG || '',
      ZYYCJGBTZR: res.ZYYCJGBTZR || '',
      NEXT_DATE: res.NEXT_DATE || addDays(res.ZYYCJGTZRQ, 7)
    })
    setIsDialogOpen(true)
  }

  const handleSubmitResult = async () => {
    if (!formData.PERSONID || !formData.ZYYCJGXQ) {
      toast({ variant: "destructive", title: "校验未通过", description: "档案编号及异常详情为系统核心字段，不可为空" })
      return
    }
    setSubmitting(true)
    try {
      if (!editId) {
        const resultId = `R${Date.now()}`;
        const success = await DataService.addAbnormalResult({ 
          ...formData, 
          ID: resultId 
        })
        
        if (success) {
          try {
            const patients = await DataService.getPatients();
            const existingPatient = patients.find(p => p.PERSONID === formData.PERSONID);
            if (existingPatient) {
              setPatientData({
                PERSONNAME: existingPatient.PERSONNAME,
                SEX: existingPatient.SEX,
                AGE: existingPatient.AGE,
                PHONE: existingPatient.PHONE,
                IDNO: existingPatient.IDNO
              });
            }
          } catch (e) {}
          
          toast({ title: "登记成功", description: "流水已归档，请完善患者基础资料" })
          setDialogStep('patient')
        } else {
          toast({ variant: "destructive", title: "登记失败", description: "中心数据库拒绝了本次写入请求" })
        }
      } else {
        const success = await DataService.updateAbnormalResult({
          ...formData,
          ID: editId
        })
        if (success) {
          toast({ title: "修改成功", description: "临床业务流水已实时同步" })
          setIsDialogOpen(false)
          loadData(true)
        } else {
          toast({ variant: "destructive", title: "修改失败", description: "数据同步中断，请检查网络连接" })
        }
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "系统严重错误", description: err.message || "未知逻辑故障" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitPatient = async () => {
    if (!patientData.PERSONNAME || !patientData.PHONE) {
      toast({ variant: "destructive", title: "资料不全", description: "姓名与联系方式是档案核心要素" })
      return
    }
    setSubmitting(true)
    try {
      const storedUser = localStorage.getItem('currentUser');
      const optName = storedUser ? JSON.parse(storedUser).REAL_NAME : '操作员';
      
      const res = await DataService.addPatient({
        ...patientData,
        PERSONID: formData.PERSONID,
        OCCURDATE: formData.ZYYCJGTZRQ,
        OPTNAME: optName,
        SOURCE: 'manual',
        STATUS: 'alive'
      } as Person);

      if (res.success) {
        toast({ title: "中心档案同步成功", description: "患者资料已存入全院数据库" })
        setIsDialogOpen(false)
        loadData(true)
      } else {
        toast({ variant: "destructive", title: "档案同步失败", description: res.error })
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "系统异常", description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkipPatient = () => {
    toast({ title: "操作已闭环", description: "基础资料可稍后在档案中心进行补录" })
    setIsDialogOpen(false)
    loadData(true)
  }

  const filteredResults = React.useMemo(() => {
    const s = searchTerm.toLowerCase();
    return results.filter(res => 
      res.PERSONID.toLowerCase().includes(s) || 
      (res.PERSONNAME || '').toLowerCase().includes(s) ||
      (res.TJBHID || '').toLowerCase().includes(s)
    )
  }, [results, searchTerm])

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">重要异常结果登记</h1>
          <p className="text-muted-foreground mt-1 text-sm">全流程临床闭环记录 · 中心化数据库驱动</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => loadData()} disabled={loading} title="从中心库刷新流水">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={handleOpenAdd} className="font-bold"><Plus className="mr-2 h-4 w-4" /> 新增登记</Button>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-3 border-b bg-muted/5">
          <div className="relative w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="检索姓名、编号、体检号..." className="pl-8 h-9 text-xs" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[120px] text-xs font-bold">档案编号</TableHead>
                  <TableHead className="w-[100px] text-xs font-bold">姓名</TableHead>
                  <TableHead className="w-[120px] text-xs font-bold">体检流水号</TableHead>
                  <TableHead className="w-[80px] text-xs font-bold">分类</TableHead>
                  <TableHead className="min-w-[150px] text-xs font-bold">异常详情摘要</TableHead>
                  <TableHead className="w-[110px] text-xs font-bold">通知日期</TableHead>
                  <TableHead className="w-[90px] text-xs font-bold">经办人</TableHead>
                  <TableHead className="w-[100px] sticky right-0 bg-background text-right text-xs font-bold">临床操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(8)].map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredResults.length > 0 ? filteredResults.map((res) => (
                  <TableRow key={res.ID} className="text-[11px] h-11 hover:bg-muted/10 transition-colors">
                    <TableCell className="font-mono text-muted-foreground">{res.PERSONID}</TableCell>
                    <TableCell className="font-bold text-primary">
                      <Link href={`/patients/${res.PERSONID}`} className="hover:underline">{res.PERSONNAME || '待补齐'}</Link>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">{res.TJBHID || '-'}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${res.ZYYCJGFL === 'A' ? 'border-primary text-primary' : ''}`}>{res.ZYYCJGFL}类</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium" title={res.ZYYCJGXQ}>{res.ZYYCJGXQ}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{res.ZYYCJGTZRQ}</TableCell>
                    <TableCell>{res.WORKER}</TableCell>
                    <TableCell className="sticky right-0 bg-background/95 backdrop-blur text-right flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => handleOpenEdit(res)} title="编辑业务流水"><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild><Link href={`/patients/${res.PERSONID}`} title="查看完整档案"><Eye className="h-3.5 w-3.5" /></Link></Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={8} className="text-center py-24 text-muted-foreground text-xs italic">暂无相关临床登记流水</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
          {dialogStep === 'result' ? (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-primary" /> {editId ? '编辑临床流水' : '新增重要异常登记'}</DialogTitle></DialogHeader>
              <div className="grid gap-6 py-4 text-sm">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>档案编号 <span className="text-destructive">*</span></Label>
                        <Input value={formData.PERSONID} onChange={e => setFormData({...formData, PERSONID: e.target.value})} placeholder="输入中心档案 ID" disabled={!!editId} />
                      </div>
                      <div className="space-y-2">
                        <Label>体检流水号</Label>
                        <Input value={formData.TJBHID} onChange={e => setFormData({...formData, TJBHID: e.target.value})} placeholder="例如: 202501010001" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>结果分类</Label>
                          <Select value={formData.ZYYCJGFL} onValueChange={v => setFormData({...formData, ZYYCJGFL: v as any})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="A">A类 (即时干预)</SelectItem><SelectItem value="B">B类 (常规随访)</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>经办人</Label>
                          <Input value={formData.WORKER} onChange={e => setFormData({...formData, WORKER: e.target.value})} placeholder="操作人员姓名" />
                        </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>被通知人姓名</Label>
                        <Input value={formData.ZYYCJGBTZR} onChange={e => setFormData({...formData, ZYYCJGBTZR: e.target.value})} placeholder="患者本人或其家属" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>通知日期</Label>
                          <Input 
                            type="date" 
                            value={formData.ZYYCJGTZRQ} 
                            onChange={e => setFormData({
                              ...formData, 
                              ZYYCJGTZRQ: e.target.value,
                              NEXT_DATE: addDays(e.target.value, 7) 
                            })} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>通知时间</Label>
                          <Input type="time" value={formData.ZYYCJGTZSJ} onChange={e => setFormData({...formData, ZYYCJGTZSJ: e.target.value})} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5 border-primary/10">
                         <div className="flex flex-col gap-1">
                            <Label className="text-xs font-bold text-primary">临床路径标记</Label>
                            <span className="text-[10px] text-muted-foreground italic">即时干预状态确认</span>
                         </div>
                         <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                               <Label className="text-[10px] font-bold">已通知</Label>
                               <Switch checked={formData.IS_NOTIFIED} onCheckedChange={v => setFormData({...formData, IS_NOTIFIED: v})} />
                            </div>
                            <div className="flex items-center gap-2">
                               <Label className="text-[10px] font-bold">已宣教</Label>
                               <Switch checked={formData.ZYYCJGJKXJ} onCheckedChange={v => setFormData({...formData, ZYYCJGJKXJ: v})} />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                  <Label>异常情况摘要 <span className="text-destructive">*</span></Label>
                  <Textarea value={formData.ZYYCJGXQ} onChange={e => setFormData({...formData, ZYYCJGXQ: e.target.value})} className="min-h-[80px]" placeholder="记录检查发现的核心异常指标..." />
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label>医生处置意见</Label>
                      <Textarea value={formData.ZYYCJGCZYJ} onChange={e => setFormData({...formData, ZYYCJGCZYJ: e.target.value})} placeholder="临床复查或转诊建议..." className="min-h-[80px]" />
                   </div>
                   <div className="space-y-2">
                      <Label>被通知人反馈</Label>
                      <Textarea value={formData.ZYYCJGFKJG} onChange={e => setFormData({...formData, ZYYCJGFKJG: e.target.value})} placeholder="记录对方对结果的知晓与反馈..." className="min-h-[80px]" />
                   </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSubmitResult} disabled={submitting} className="w-full h-11 font-bold shadow-lg">
                   {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                   {editId ? '保存修正记录' : '确认登记并补全档案资料'}
                   {!editId && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  完善中心档案资料 ({formData.PERSONID})
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-5 py-6 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>患者姓名 <span className="text-destructive">*</span></Label>
                    <Input value={patientData.PERSONNAME} onChange={e => setPatientData({...patientData, PERSONNAME: e.target.value})} placeholder="输入姓名" />
                  </div>
                  <div className="space-y-2">
                    <Label>联系电话 <span className="text-destructive">*</span></Label>
                    <Input value={patientData.PHONE} onChange={e => setPatientData({...patientData, PHONE: e.target.value})} placeholder="患者或家属手机" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>性别</Label>
                    <Select value={patientData.SEX} onValueChange={v => setPatientData({...patientData, SEX: v as any})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="男">男</SelectItem>
                        <SelectItem value="女">女</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>当前年龄</Label>
                    <Input type="number" value={patientData.AGE} onChange={e => setPatientData({...patientData, AGE: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>身份证号 (用于跨年度身份唯一识别)</Label>
                  <Input value={patientData.IDNO} maxLength={18} onChange={e => setPatientData({...patientData, IDNO: e.target.value})} placeholder="可选输入 18 位身份证号" className="font-mono" />
                </div>
              </div>
              <DialogFooter className="flex-col gap-3">
                <Button onClick={handleSubmitPatient} disabled={submitting} className="w-full h-11 font-bold shadow-md">
                   {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                   保存并建立中心化索引
                </Button>
                <Button variant="ghost" onClick={handleSkipPatient} className="w-full text-muted-foreground text-xs hover:text-primary">
                  暂不录入资料，仅保留档案编号
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
