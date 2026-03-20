
"use client"

import * as React from 'react'
import { Plus, Search, FileDown, Eye, Loader2, Link as LinkIcon } from 'lucide-react'
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
      toast({ variant: "destructive", title: "数据同步失败", description: "无法从中心数据库拉取记录" })
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
    const headers = [
      "档案编号", "体检编号", "姓名", "性别", "年龄", "分类", 
      "重要异常结果详情", "随访路径", "预定下次随访", "通知医生", "通知日期"
    ];
    const rows = results.map(res => [
      res.PERSONID, res.TJBHID || '', res.PERSONNAME || '未知', res.SEX || '-', res.AGE || '-', `${res.ZYYCJGFL}类`, 
      `"${(res.ZYYCJGXQ || '').replace(/"/g, '""')}"`, res.PATH_NAME || '-', res.NEXT_DATE || '-', res.WORKER, res.ZYYCJGTZRQ
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `重要异常结果登记表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: "报表导出成功" })
  }

  const handleSubmit = async () => {
    if (!formData.PERSONID) {
      toast({ variant: "destructive", title: "校验失败", description: "档案编号不可为空" })
      return
    }
    setSubmitting(true)
    const success = await DataService.addAbnormalResult({ ...formData, ID: `R${Date.now()}` } as AbnormalResult)
    if (success) {
      toast({ title: "登记成功" })
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
          <p className="text-muted-foreground mt-1">闭环管理业务异常结果</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><FileDown className="mr-2 h-4 w-4" /> 导出报表</Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" /> 新增登记</Button></DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader><DialogTitle>重要异常结果登记</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>档案编号</Label><Input value={formData.PERSONID} onChange={e => setFormData({...formData, PERSONID: e.target.value})} /></div>
                  <div className="space-y-2"><Label>体检编号</Label><Input value={formData.TJBHID} onChange={e => setFormData({...formData, TJBHID: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><Label>重要异常结果详情</Label><Textarea value={formData.ZYYCJGXQ} onChange={e => setFormData({...formData, ZYYCJGXQ: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>随访路径</Label>
                    <Select value={formData.PATH_ID} onValueChange={v => setFormData({...formData, PATH_ID: v})}>
                      <SelectTrigger><SelectValue placeholder="选择预定义的临床路径..." /></SelectTrigger>
                      <SelectContent>
                        {paths.map(p => <SelectItem key={p.ID} value={p.ID}>{p.NAME}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>预定下次随访日期</Label>
                    <Input type="date" value={formData.NEXT_DATE} onChange={e => setFormData({...formData, NEXT_DATE: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>分类</Label>
                    <Select value={formData.ZYYCJGFL} onValueChange={v => setFormData({...formData, ZYYCJGFL: v as any})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A类</SelectItem>
                        <SelectItem value="B">B类</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-6 pt-8">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="notified" checked={formData.IS_NOTIFIED} onCheckedChange={(v) => setFormData({...formData, IS_NOTIFIED: !!v})} />
                      <Label htmlFor="notified">是否通知</Label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>通知日期</Label><Input type="date" value={formData.ZYYCJGTZRQ} onChange={e => setFormData({...formData, ZYYCJGTZRQ: e.target.value})} /></div>
                  <div className="space-y-2"><Label>通知时间</Label><Input type="time" value={formData.ZYYCJGTZSJ} onChange={e => setFormData({...formData, ZYYCJGTZSJ: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>通知医生</Label><Input value={formData.WORKER} onChange={e => setFormData({...formData, WORKER: e.target.value})} /></div>
                  <div className="space-y-2"><Label>被通知人</Label><Input value={formData.ZYYCJGBTZR} onChange={e => setFormData({...formData, ZYYCJGBTZR: e.target.value})} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSubmit} disabled={submitting}>{submitting ? <Loader2 className="animate-spin" /> : "保存并生成随访预警"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">已登记异常结果列表</CardTitle>
            <div className="relative w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="姓名、档案号、体检号..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px] text-xs">档案编号</TableHead>
                  <TableHead className="w-[100px] text-xs">姓名</TableHead>
                  <TableHead className="w-[80px] text-xs">分类</TableHead>
                  <TableHead className="min-w-[200px] text-xs">异常详情</TableHead>
                  <TableHead className="w-[150px] text-xs">随访路径</TableHead>
                  <TableHead className="w-[120px] text-xs text-blue-600 font-bold">预定下次随访</TableHead>
                  <TableHead className="w-[110px] text-xs">登记日期</TableHead>
                  <TableHead className="w-[100px] text-xs">通知医生</TableHead>
                  <TableHead className="w-[80px] sticky right-0 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.05)] text-xs">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredResults.length > 0 ? filteredResults.map((res) => (
                  <TableRow key={res.ID} className="text-xs">
                    <TableCell className="font-mono">{res.PERSONID}</TableCell>
                    <TableCell className="font-medium text-primary"><Link href={`/patients/${res.PERSONID}`} className="hover:underline">{res.PERSONNAME || '未知'}</Link></TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{res.ZYYCJGFL}类</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate" title={res.ZYYCJGXQ}>{res.ZYYCJGXQ}</TableCell>
                    <TableCell>
                       {res.PATH_NAME ? (
                         <div className="flex items-center gap-1">
                           <span className="truncate max-w-[120px]">{res.PATH_NAME}</span>
                           {res.PATH_URL && (
                             <a href={res.PATH_URL} target="_blank" className="text-blue-500 hover:text-blue-700">
                               <LinkIcon className="h-3 w-3" />
                             </a>
                           )}
                         </div>
                       ) : '-'}
                    </TableCell>
                    <TableCell className="font-mono text-blue-600 font-bold">{res.NEXT_DATE || '-'}</TableCell>
                    <TableCell className="font-mono">{res.ZYYCJGTZRQ}</TableCell>
                    <TableCell>{res.WORKER}</TableCell>
                    <TableCell className="sticky right-0 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                      <Button variant="ghost" size="sm" asChild><Link href={`/patients/${res.PERSONID}`}><Eye className="h-3.5 w-3.5" /></Link></Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={9} className="text-center py-20 text-muted-foreground italic">未检索到记录</TableCell></TableRow>
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
