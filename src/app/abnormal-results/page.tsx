
"use client"

import * as React from 'react'
import { Plus, Search, FileDown, Eye, Loader2, Link as LinkIcon, BookOpen } from 'lucide-react'
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
import { AbnormalResult, FollowUpPath } from '@/lib/types'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { DataService } from '@/services/data-service'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

export default function AbnormalResultsPage() {
  const { toast } = useToast()
  const [results, setResults] = React.useState<AbnormalResult[]>([])
  const [paths, setPaths] = React.useState<FollowUpPath[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  
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
    PATH_ID: '',
    NEXT_DATE: '',
    IS_HEALTH_EDU: true,
    IS_NOTIFIED: true,
  })

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [resData, pathData] = await Promise.all([
        DataService.getAbnormalResults(),
        DataService.getFollowUpPaths()
      ])
      setResults(resData)
      setPaths(pathData)
    } catch (err) {
      toast({ variant: "destructive", title: "数据同步失败", description: "中心库响应超时" })
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
      setFormData(prev => ({
        ...prev,
        ZYYCJGTZRQ: new Date().toISOString().split('T')[0],
        ZYYCJGTZSJ: new Date().toTimeString().slice(0, 5),
        WORKER: realName
      }))
    }
  }, [isDialogOpen])

  const filteredResults = results.filter(res => {
    const searchLower = searchTerm.toLowerCase();
    const personName = res.PERSONNAME || '';
    return (
      res.PERSONID.toLowerCase().includes(searchLower) || 
      (res.TJBHID || '').toLowerCase().includes(searchLower) ||
      personName.toLowerCase().includes(searchLower)
    );
  })

  const handleExport = () => {
    if (results.length === 0) return
    const headers = ["档案编号", "体检编号", "姓名", "分类", "异常详情", "随访计划", "触发日期", "通知人员"];
    const rows = results.map(res => [
      res.PERSONID, res.TJBHID || '', res.PERSONNAME || '未知', `${res.ZYYCJGFL}类`, 
      `"${(res.ZYYCJGXQ || '').replace(/"/g, '""')}"`, res.PATH_NAME || '-', res.NEXT_DATE || '-', res.WORKER
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `重要异常登记表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  const handleSubmit = async () => {
    if (!formData.PERSONID || !formData.PATH_ID || !formData.NEXT_DATE) {
      toast({ variant: "destructive", title: "校验失败", description: "档案编号、随访计划及触发日期为必填项" })
      return
    }
    setSubmitting(true)
    const success = await DataService.addAbnormalResult({ ...formData, ID: `R${Date.now()}` } as AbnormalResult)
    if (success) {
      toast({ title: "登记成功", description: "标准化随访计划已激活" })
      setIsDialogOpen(false)
      loadData()
    }
    setSubmitting(false)
  }

  if (!isMounted) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">重要异常结果登记</h1>
          <p className="text-muted-foreground mt-1">关联临床标准化随访计划</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><FileDown className="mr-2 h-4 w-4" /> 导出</Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" /> 新增登记</Button></DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader><DialogTitle>重要异常结果与计划关联</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>档案编号</Label><Input value={formData.PERSONID} onChange={e => setFormData({...formData, PERSONID: e.target.value})} /></div>
                  <div className="space-y-2"><Label>体检编号</Label><Input value={formData.TJBHID} onChange={e => setFormData({...formData, TJBHID: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><Label>异常详情</Label><Textarea value={formData.ZYYCJGXQ} onChange={e => setFormData({...formData, ZYYCJGXQ: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-blue-600 font-bold">关联随访计划</Label>
                    <Select value={formData.PATH_ID} onValueChange={v => setFormData({...formData, PATH_ID: v})}>
                      <SelectTrigger className="border-blue-200"><SelectValue placeholder="选择对应的疾病随访计划..." /></SelectTrigger>
                      <SelectContent>
                        {paths.map(p => <SelectItem key={p.ID} value={p.ID}>{p.NAME}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-600 font-bold">计划触发日期</Label>
                    <Input type="date" value={formData.NEXT_DATE} className="border-blue-200" onChange={e => setFormData({...formData, NEXT_DATE: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>结果分类</Label>
                    <Select value={formData.ZYYCJGFL} onValueChange={v => setFormData({...formData, ZYYCJGFL: v as any})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="A">A类</SelectItem><SelectItem value="B">B类</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>通知人员</Label><Input value={formData.WORKER} onChange={e => setFormData({...formData, WORKER: e.target.value})} /></div>
                  <div className="flex items-center gap-2 pt-8">
                    <Checkbox id="notified" checked={formData.IS_NOTIFIED} onCheckedChange={(v) => setFormData({...formData, IS_NOTIFIED: !!v})} />
                    <Label htmlFor="notified">已完成首诊通知</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12">
                   {submitting ? <Loader2 className="animate-spin" /> : "激活标准化随访预警"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">全院登记流水</CardTitle>
            <div className="relative w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="检索姓名、编号..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
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
                  <TableHead className="min-w-[200px]">异常详情</TableHead>
                  <TableHead className="w-[150px] text-blue-600 font-bold">执行计划</TableHead>
                  <TableHead className="w-[120px] text-destructive font-bold">预定触发日期</TableHead>
                  <TableHead className="w-[110px]">登记日期</TableHead>
                  <TableHead className="w-[80px] sticky right-0 bg-background">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredResults.length > 0 ? filteredResults.map((res) => (
                  <TableRow key={res.ID} className="text-xs">
                    <TableCell className="font-mono">{res.PERSONID}</TableCell>
                    <TableCell className="font-medium text-primary"><Link href={`/patients/${res.PERSONID}`} className="hover:underline">{res.PERSONNAME || '未知'}</Link></TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{res.ZYYCJGFL}类</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate" title={res.ZYYCJGXQ}>{res.ZYYCJGXQ}</TableCell>
                    <TableCell>
                       {res.PATH_NAME ? (
                         <div className="flex items-center gap-1">
                           <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{res.PATH_NAME}</Badge>
                         </div>
                       ) : '-'}
                    </TableCell>
                    <TableCell className="font-mono text-destructive font-bold">{res.NEXT_DATE || '-'}</TableCell>
                    <TableCell className="font-mono">{res.ZYYCJGTZRQ}</TableCell>
                    <TableCell className="sticky right-0 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.05)] text-right">
                      <Button variant="ghost" size="sm" asChild><Link href={`/patients/${res.PERSONID}`}><Eye className="h-4 w-4" /></Link></Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={8} className="text-center py-20 text-muted-foreground">无匹配记录</TableCell></TableRow>
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
