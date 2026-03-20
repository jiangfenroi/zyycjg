
"use client"

import * as React from 'react'
import { Plus, Search, Eye, Loader2, RefreshCw, Edit2, UserPlus, CheckCircle2, ArrowRight } from 'lucide-react'
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
      toast({ variant: "destructive", title: "数据同步失败", description: "远程数据库响应超时" })
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
      toast({ variant: "destructive", title: "校验失败", description: "档案编号及异常详情为必填项" })
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
          
          toast({ title: "结果登记成功", description: "请完善患者基本资料" })
          setDialogStep('patient')
        }
      } else {
        const success = await DataService.updateAbnormalResult({
          ...formData,
          ID: editId
        })
        if (success) {
          toast({ title: "修改成功" })
          setIsDialogOpen(false)
          loadData(true)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitPatient = async () => {
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
        toast({ title: "资料同步成功", description: "患者档案已更新" })
        setIsDialogOpen(false)
        loadData(true)
      } else {
        toast({ variant: "destructive", title: "同步失败", description: res.error })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkipPatient = () => {
    toast({ title: "流程已结束", description: "资料可稍后在档案中心补录" })
    setIsDialogOpen(false)
    loadData(true)
  }

  const filteredResults = React.useMemo(() => {
    const s = searchTerm.toLowerCase();
    return results.filter(res => 
      res.PERSONID.toLowerCase().includes(s) || (res.PERSONNAME || '').toLowerCase().includes(s)
    )
  }, [results, searchTerm])

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">重要异常结果登记</h1>
          <p className="text-muted-foreground mt-1 text-sm">全流程临床闭环记录 · 物理入库中心化管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => loadData()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={handleOpenAdd}><Plus className="mr-2 h-4 w-4" /> 新增登记</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="relative w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="检索姓名、编号..." className="pl-8 h-9 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px] text-xs">档案编号</TableHead>
                  <TableHead className="w-[100px] text-xs">姓名</TableHead>
                  <TableHead className="w-[120px] text-xs">体检编号</TableHead>
                  <TableHead className="w-[80px] text-xs">分类</TableHead>
                  <TableHead className="min-w-[150px] text-xs">异常摘要</TableHead>
                  <TableHead className="w-[110px] text-xs">通知日期</TableHead>
                  <TableHead className="w-[90px] text-xs">通知人</TableHead>
                  <TableHead className="w-[100px] sticky right-0 bg-background text-right text-xs">操作</TableHead>
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
                  <TableRow key={res.ID} className="text-[11px] h-11">
                    <TableCell className="font-mono">{res.PERSONID}</TableCell>
                    <TableCell className="font-medium text-primary"><Link href={`/patients/${res.PERSONID}`} className="hover:underline">{res.PERSONNAME || '待补全'}</Link></TableCell>
                    <TableCell className="font-mono text-muted-foreground">{res.TJBHID || '-'}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[9px] px-1.5 py-0">{res.ZYYCJGFL}类</Badge></TableCell>
                    <TableCell className="max-w-[150px] truncate" title={res.ZYYCJGXQ}>{res.ZYYCJGXQ}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{res.ZYYCJGTZRQ}</TableCell>
                    <TableCell>{res.WORKER}</TableCell>
                    <TableCell className="sticky right-0 bg-background text-right flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(res)} title="编辑流水"><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild><Link href={`/patients/${res.PERSONID}`} title="查看详情"><Eye className="h-3.5 w-3.5" /></Link></Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={8} className="text-center py-20 text-muted-foreground text-xs italic">暂无登记流水记录</TableCell></TableRow>
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
              <DialogHeader><DialogTitle>{editId ? '编辑异常登记流水' : '新增重要异常登记'}</DialogTitle></DialogHeader>
              <div className="grid gap-6 py-4 text-sm">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>档案编号 <span className="text-destructive">*</span></Label>
                        <Input value={formData.PERSONID} onChange={e => setFormData({...formData, PERSONID: e.target.value})} placeholder="输入档案 ID" disabled={!!editId} />
                      </div>
                      <div className="space-y-2">
                        <Label>体检流水号</Label>
                        <Input value={formData.TJBHID} onChange={e => setFormData({...formData, TJBHID: e.target.value})} placeholder="202501010001" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>结果分类</Label>
                          <Select value={formData.ZYYCJGFL} onValueChange={v => setFormData({...formData, ZYYCJGFL: v as any})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="A">A类 (即时)</SelectItem><SelectItem value="B">B类 (常规)</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>通知人</Label>
                          <Input value={formData.WORKER} onChange={e => setFormData({...formData, WORKER: e.target.value})} placeholder="经办人员" />
                        </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>被通知人姓名</Label>
                        <Input value={formData.ZYYCJGBTZR} onChange={e => setFormData({...formData, ZYYCJGBTZR: e.target.value})} placeholder="家属或本人" />
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
                      <div className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                         <div className="flex flex-col gap-1">
                            <Label className="text-xs font-bold">闭环标记</Label>
                            <span className="text-[10px] text-muted-foreground italic">标记处理状态</span>
                         </div>
                         <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                               <Label className="text-[10px]">已通知</Label>
                               <Switch checked={formData.IS_NOTIFIED} onCheckedChange={v => setFormData({...formData, IS_NOTIFIED: v})} />
                            </div>
                            <div className="flex items-center gap-2">
                               <Label className="text-[10px]">已宣教</Label>
                               <Switch checked={formData.ZYYCJGJKXJ} onCheckedChange={v => setFormData({...formData, ZYYCJGJKXJ: v})} />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                  <Label>异常情况描述摘要 <span className="text-destructive">*</span></Label>
                  <Textarea value={formData.ZYYCJGXQ} onChange={e => setFormData({...formData, ZYYCJGXQ: e.target.value})} className="min-h-[80px]" placeholder="记录检查发现的异常指标..." />
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label>医生处置意见</Label>
                      <Textarea value={formData.ZYYCJGCZYJ} onChange={e => setFormData({...formData, ZYYCJGCZYJ: e.target.value})} placeholder="复查、转诊建议..." className="min-h-[80px]" />
                   </div>
                   <div className="space-y-2">
                      <Label>被通知人反馈</Label>
                      <Textarea value={formData.ZYYCJGFKJG} onChange={e => setFormData({...formData, ZYYCJGFKJG: e.target.value})} placeholder="对方回复信息..." className="min-h-[80px]" />
                   </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSubmitResult} disabled={submitting} className="w-full h-11 font-bold">
                   {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                   {editId ? '保存业务流水' : '确认登记并完善基本资料'}
                   {!editId && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  完善患者中心档案 ({formData.PERSONID})
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-6 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>患者姓名</Label>
                    <Input value={patientData.PERSONNAME} onChange={e => setPatientData({...patientData, PERSONNAME: e.target.value})} placeholder="输入姓名" />
                  </div>
                  <div className="space-y-2">
                    <Label>手机号码</Label>
                    <Input value={patientData.PHONE} onChange={e => setPatientData({...patientData, PHONE: e.target.value})} placeholder="联系电话" />
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
                    <Label>年龄</Label>
                    <Input type="number" value={patientData.AGE} onChange={e => setPatientData({...patientData, AGE: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>身份证号 (可选)</Label>
                  <Input value={patientData.IDNO} maxLength={18} onChange={e => setPatientData({...patientData, IDNO: e.target.value})} placeholder="18位身份证号" />
                </div>
              </div>
              <DialogFooter className="flex-col gap-3">
                <Button onClick={handleSubmitPatient} disabled={submitting} className="w-full h-11 font-bold">
                   {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                   保存中心库资料并结案
                </Button>
                <Button variant="ghost" onClick={handleSkipPatient} className="w-full text-muted-foreground text-xs">
                  稍后补录资料，直接结束当前流程
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
