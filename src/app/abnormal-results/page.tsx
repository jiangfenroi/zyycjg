
"use client"

import * as React from 'react'
import { Plus, Search, Eye, Loader2, FileUp, X, RefreshCw, Edit2 } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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
  const [submitting, setSubmitting] = React.useState(false)
  const [editId, setEditId] = React.useState<string | null>(null)
  
  const [selectedFiles, setSelectedFiles] = React.useState<{path: string, name: string}[]>([])

  const [formData, setFormData] = React.useState({
    PERSONID: '',
    TJBHID: '',
    ZYYCJGXQ: '',
    ZYYCJGFL: 'A' as 'A' | 'B',
    ZYYCJGCZYJ: '', 
    ZYYCJGFKJG: '',
    ZYYCJGTZRQ: '',
    ZYYCJGTZSJ: '',
    WORKER: '',
    ZYYCJGBTZR: '',
    NEXT_DATE: '',
    IS_NOTIFIED: true,
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
    const storedUser = localStorage.getItem('currentUser');
    const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '操作员';
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      PERSONID: '',
      TJBHID: '',
      ZYYCJGXQ: '',
      ZYYCJGFL: 'A',
      ZYYCJGCZYJ: '', 
      ZYYCJGFKJG: '',
      ZYYCJGTZRQ: today,
      ZYYCJGTZSJ: new Date().toTimeString().slice(0, 5),
      WORKER: realName,
      ZYYCJGBTZR: '',
      NEXT_DATE: addDays(today, 7),
      IS_NOTIFIED: true
    })
    setSelectedFiles([])
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (res: AbnormalResult) => {
    setEditId(res.ID)
    setFormData({
      PERSONID: res.PERSONID,
      TJBHID: res.TJBHID || '',
      ZYYCJGXQ: res.ZYYCJGXQ,
      ZYYCJGFL: res.ZYYCJGFL,
      ZYYCJGCZYJ: res.ZYYCJGCZYJ || '', 
      ZYYCJGFKJG: res.ZYYCJGFKJG || '',
      ZYYCJGTZRQ: res.ZYYCJGTZRQ,
      ZYYCJGTZSJ: res.ZYYCJGTZSJ,
      WORKER: res.WORKER,
      ZYYCJGBTZR: res.ZYYCJGBTZR || '',
      NEXT_DATE: res.NEXT_DATE || addDays(res.ZYYCJGTZRQ, 7),
      IS_NOTIFIED: res.IS_NOTIFIED
    })
    setSelectedFiles([])
    setIsDialogOpen(true)
  }

  const handleSelectFiles = async () => {
    const files = await DataService.selectLocalFiles(true);
    if (files && files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }

  const handleSubmit = async () => {
    if (!formData.PERSONID || !formData.ZYYCJGXQ) {
      toast({ variant: "destructive", title: "校验失败", description: "档案编号及异常详情为必填项" })
      return
    }
    setSubmitting(true)
    try {
      if (!editId) {
        const patients = await DataService.getPatients()
        const exists = patients.some(p => p.PERSONID === formData.PERSONID)
        if (!exists) {
          await DataService.addPatient({
            PERSONID: formData.PERSONID,
            PERSONNAME: '待补全患者',
            SEX: '男',
            AGE: 0,
            PHONE: '',
            OCCURDATE: new Date().toISOString().split('T')[0],
            OPTNAME: formData.WORKER
          } as Person)
        }

        const resultId = `R${Date.now()}`;
        const success = await DataService.addAbnormalResult({ 
          ...formData, 
          ID: resultId 
        } as AbnormalResult)
        
        if (success) {
          if (selectedFiles.length > 0) {
            for (const file of selectedFiles) {
              await DataService.uploadDocument(file.path, formData.PERSONID, 'PE_REPORT', formData.ZYYCJGTZRQ);
            }
          }
          toast({ title: "登记成功" })
        }
      } else {
        const success = await DataService.updateAbnormalResult({
          ...formData,
          ID: editId
        } as AbnormalResult)
        if (success) {
          toast({ title: "修改成功" })
        }
      }
      setIsDialogOpen(false)
      loadData(true)
    } finally {
      setSubmitting(false)
    }
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
          <p className="text-muted-foreground mt-1 text-sm">临床发现流水记录，基于体检日期与通知日期双核预警</p>
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
                  <TableHead className="min-w-[200px] text-xs">异常详情</TableHead>
                  <TableHead className="w-[110px] text-xs">通知日期</TableHead>
                  <TableHead className="w-[100px] sticky right-0 bg-background text-right text-xs">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredResults.length > 0 ? filteredResults.map((res) => (
                  <TableRow key={res.ID} className="text-[11px] h-11">
                    <TableCell className="font-mono">{res.PERSONID}</TableCell>
                    <TableCell className="font-medium text-primary"><Link href={`/patients/${res.PERSONID}`} className="hover:underline">{res.PERSONNAME || '未知'}</Link></TableCell>
                    <TableCell className="font-mono text-muted-foreground">{res.TJBHID || '-'}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[9px] px-1.5 py-0">{res.ZYYCJGFL}类</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate" title={res.ZYYCJGXQ}>{res.ZYYCJGXQ}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{res.ZYYCJGTZRQ}</TableCell>
                    <TableCell className="sticky right-0 bg-background text-right flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(res)} title="编辑记录"><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild><Link href={`/patients/${res.PERSONID}`} title="查看详情"><Eye className="h-3.5 w-3.5" /></Link></Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground text-xs italic">暂无登记流水记录</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? '编辑业务流水' : '中心化业务登记'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>档案编号</Label>
                <Input value={formData.PERSONID} onChange={e => setFormData({...formData, PERSONID: e.target.value})} placeholder="输入编号" disabled={!!editId} />
              </div>
              <div className="space-y-2">
                <Label>体检编号</Label>
                <Input value={formData.TJBHID} onChange={e => setFormData({...formData, TJBHID: e.target.value})} placeholder="例如 202501020001" />
              </div>
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
                <Label>结果分类</Label>
                <Select value={formData.ZYYCJGFL} onValueChange={v => setFormData({...formData, ZYYCJGFL: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="A">A类 (即时)</SelectItem><SelectItem value="B">B类 (常规)</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>异常详情摘要</Label><Textarea value={formData.ZYYCJGXQ} onChange={e => setFormData({...formData, ZYYCJGXQ: e.target.value})} className="min-h-[100px]" /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={submitting} className="w-full h-11">
               {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
               {editId ? '保存修改' : '确认登记'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
