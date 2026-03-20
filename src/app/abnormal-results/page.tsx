
"use client"

import * as React from 'react'
import { Plus, Search, Eye, Loader2, FileUp, X } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { AbnormalResult, Person } from '@/lib/types'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { DataService } from '@/services/data-service'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

// 随访日期推算辅助函数：默认 7 天后
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
  const [isMounted, setIsMounted] = React.useState(false)
  
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

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const resData = await DataService.getAbnormalResults()
      setResults(resData)
    } catch (err) {
      toast({ variant: "destructive", title: "数据同步失败", description: "远程数据库响应超时" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    setIsMounted(true)
    loadData()
  }, [loadData])

  React.useEffect(() => {
    if (isDialogOpen) {
      const storedUser = localStorage.getItem('currentUser');
      const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '操作员';
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        ZYYCJGTZRQ: today,
        ZYYCJGTZSJ: new Date().toTimeString().slice(0, 5),
        NEXT_DATE: addDays(today, 7), // 默认 7 天后随访
        WORKER: realName
      }))
      setSelectedFiles([])
    }
  }, [isDialogOpen])

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
      // 1. 自动建档检查
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

      // 2. 存储异常记录
      const resultId = `R${Date.now()}`;
      const success = await DataService.addAbnormalResult({ 
        ...formData, 
        ID: resultId 
      } as AbnormalResult)
      
      if (success) {
        // 3. 处理附件同步
        if (selectedFiles.length > 0) {
          for (const file of selectedFiles) {
            await DataService.uploadDocument(file.path, formData.PERSONID, 'PE_REPORT', formData.ZYYCJGTZRQ);
          }
        }

        toast({ title: "登记成功", description: "记录及附件已物理同步至中心库" })
        setIsDialogOpen(false)
        loadData()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const filteredResults = results.filter(res => {
    const s = searchTerm.toLowerCase();
    return res.PERSONID.toLowerCase().includes(s) || (res.PERSONNAME || '').includes(s);
  })

  if (!isMounted) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">重要异常结果登记</h1>
          <p className="text-muted-foreground mt-1">临床发现流水记录，自动推算 7 天随访周期</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" /> 新增登记</Button></DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>中心化业务登记</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>档案编号</Label><Input value={formData.PERSONID} onChange={e => setFormData({...formData, PERSONID: e.target.value})} placeholder="输入编号" /></div>
                <div className="space-y-2">
                  <Label>通知日期</Label>
                  <Input 
                    type="date" 
                    value={formData.ZYYCJGTZRQ} 
                    onChange={e => setFormData({
                      ...formData, 
                      ZYYCJGTZRQ: e.target.value,
                      NEXT_DATE: addDays(e.target.value, 7) // 联动更新随访日期
                    })} 
                  />
                </div>
              </div>
              <div className="space-y-2"><Label>异常详情摘要</Label><Textarea value={formData.ZYYCJGXQ} onChange={e => setFormData({...formData, ZYYCJGXQ: e.target.value})} className="min-h-[100px]" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-destructive font-bold">预定下次随访日期 (默认 T+7)</Label>
                  <Input type="date" value={formData.NEXT_DATE} className="border-destructive/30" onChange={e => setFormData({...formData, NEXT_DATE: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>结果分类</Label>
                  <Select value={formData.ZYYCJGFL} onValueChange={v => setFormData({...formData, ZYYCJGFL: v as any})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="A">A类 (即时)</SelectItem><SelectItem value="B">B类 (常规)</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="p-4 border-2 border-dashed rounded-lg space-y-4 bg-muted/20">
                <div className="flex justify-between items-center">
                  <Label className="font-bold flex items-center gap-2"><FileUp className="h-4 w-4" /> 关联体检报告附件 (PDF)</Label>
                  <Button variant="outline" size="sm" onClick={handleSelectFiles}>选择本地文件</Button>
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
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12">
                 {submitting ? <Loader2 className="animate-spin mr-2" /> : null}
                 确认登记并同步中心库
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="relative w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="检索姓名、编号..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px]">档案编号</TableHead>
                  <TableHead className="w-[100px]">姓名</TableHead>
                  <TableHead className="w-[80px]">分类</TableHead>
                  <TableHead className="min-w-[250px]">异常详情</TableHead>
                  <TableHead className="w-[120px] text-destructive font-bold">预定随访</TableHead>
                  <TableHead className="w-[110px]">登记日期</TableHead>
                  <TableHead className="w-[80px] sticky right-0 bg-background text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredResults.length > 0 ? filteredResults.map((res) => (
                  <TableRow key={res.ID} className="text-xs">
                    <TableCell className="font-mono">{res.PERSONID}</TableCell>
                    <TableCell className="font-medium text-primary"><Link href={`/patients/${res.PERSONID}`} className="hover:underline">{res.PERSONNAME || '未知'}</Link></TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{res.ZYYCJGFL}类</Badge></TableCell>
                    <TableCell className="max-w-[250px] truncate" title={res.ZYYCJGXQ}>{res.ZYYCJGXQ}</TableCell>
                    <TableCell className="font-mono text-destructive font-bold">{res.NEXT_DATE || '-'}</TableCell>
                    <TableCell className="font-mono">{res.ZYYCJGTZRQ}</TableCell>
                    <TableCell className="sticky right-0 bg-background text-right">
                      <Button variant="ghost" size="sm" asChild><Link href={`/patients/${res.PERSONID}`}><Eye className="h-4 w-4" /></Link></Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground">暂无登记流水记录</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
