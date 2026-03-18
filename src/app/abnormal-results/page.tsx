
"use client"

import * as React from 'react'
import { Plus, Search, FileDown, Eye, Loader2 } from 'lucide-react'
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
import { AbnormalResult } from '@/lib/types'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { DataService } from '@/services/data-service'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

export default function AbnormalResultsPage() {
  const { toast } = useToast()
  const [results, setResults] = React.useState<AbnormalResult[]>([])
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
    IS_HEALTH_EDU: true,
    IS_NOTIFIED: true,
  })

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await DataService.getAbnormalResults()
      setResults(data)
    } catch (err) {
      toast({ variant: "destructive", title: "数据同步失败", description: "无法从中心数据库拉取记录。" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    setIsMounted(true)
    loadData()
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '';
      setFormData(prev => ({
        ...prev,
        ZYYCJGTZRQ: new Date().toISOString().split('T')[0],
        ZYYCJGTZSJ: new Date().toTimeString().slice(0, 5),
        WORKER: realName
      }))
    }
  }, [loadData])

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
      "档案编号", "体检编号", "姓名", "性别", "年龄", "联系电话", "体检日期", "分类", 
      "重要异常结果详情", "是否通知", "是否健康宣教", "通知日期", "通知时间", "通知医生", 
      "被通知人", "处置建议"
    ];
    const rows = results.map(res => [
      res.PERSONID, res.TJBHID || '', res.PERSONNAME || '未知', res.SEX || '-', res.AGE || '-', res.PHONE || '-', res.OCCURDATE || '-', `${res.ZYYCJGFL}类`, 
      `"${(res.ZYYCJGXQ || '').replace(/"/g, '""')}"`, res.IS_NOTIFIED ? '是' : '否', res.IS_HEALTH_EDU ? '是' : '否',
      res.ZYYCJGTZRQ, res.ZYYCJGTZSJ, res.WORKER, res.ZYYCJGBTZR, `"${(res.ZYYCJGCZYJ || '').replace(/"/g, '""')}"`
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
      toast({ variant: "destructive", title: "校验失败", description: "档案编号不可为空。" })
      return
    }
    setSubmitting(true)
    const success = await DataService.addAbnormalResult({ ...formData, ID: `R${Date.now()}` } as AbnormalResult)
    if (success) {
      toast({ title: "登记成功" })
      setIsDialogOpen(false)
      loadData()
      const storedUser = localStorage.getItem('currentUser');
      const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '';
      setFormData({
        PERSONID: '', TJBHID: '', ZYYCJGXQ: '', ZYYCJGFL: 'A', ZYYCJGCZYJ: '', ZYYCJGFKJG: '',
        ZYYCJGTZRQ: new Date().toISOString().split('T')[0], ZYYCJGTZSJ: new Date().toTimeString().slice(0, 5),
        WORKER: realName, ZYYCJGBTZR: '', IS_HEALTH_EDU: true, IS_NOTIFIED: true
      })
    }
    setSubmitting(false)
  }

  if (!isMounted) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">重要异常结果登记</h1>
          <p className="text-muted-foreground mt-1">闭环管理业务异常结果。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><FileDown className="mr-2 h-4 w-4" /> 导出报表</Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" /> 新增登记</Button></DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader><DialogTitle>重要异常结果登记入库</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>档案编号</Label><Input value={formData.PERSONID} onChange={e => setFormData({...formData, PERSONID: e.target.value})} /></div>
                  <div className="space-y-2"><Label>体检编号</Label><Input value={formData.TJBHID} onChange={e => setFormData({...formData, TJBHID: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><Label>重要异常结果详情</Label><Textarea value={formData.ZYYCJGXQ} onChange={e => setFormData({...formData, ZYYCJGXQ: e.target.value})} /></div>
                <div className="space-y-2"><Label>处置建议</Label><Textarea value={formData.ZYYCJGCZYJ} onChange={e => setFormData({...formData, ZYYCJGCZYJ: e.target.value})} /></div>
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
                    <div className="flex items-center space-x-2">
                      <Checkbox id="health" checked={formData.IS_HEALTH_EDU} onCheckedChange={(v) => setFormData({...formData, IS_HEALTH_EDU: !!v})} />
                      <Label htmlFor="health">是否健康宣教</Label>
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
                <Button onClick={handleSubmit} disabled={submitting}>{submitting ? <Loader2 className="animate-spin" /> : "同步写入中心库"}</Button>
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
                  <TableHead className="w-[120px] sticky left-0 bg-muted/50 z-10 text-xs">档案编号</TableHead>
                  <TableHead className="w-[120px] text-xs">体检编号</TableHead>
                  <TableHead className="w-[100px] text-xs">姓名</TableHead>
                  <TableHead className="w-[60px] text-xs">性别</TableHead>
                  <TableHead className="w-[60px] text-xs">年龄</TableHead>
                  <TableHead className="w-[120px] text-xs">联系电话</TableHead>
                  <TableHead className="w-[110px] text-xs">体检日期</TableHead>
                  <TableHead className="w-[80px] text-xs">分类</TableHead>
                  <TableHead className="min-w-[200px] text-xs">重要异常结果详情</TableHead>
                  <TableHead className="w-[80px] text-xs">是否通知</TableHead>
                  <TableHead className="w-[80px] text-xs">是否健康宣教</TableHead>
                  <TableHead className="w-[110px] text-xs">通知日期</TableHead>
                  <TableHead className="w-[90px] text-xs">通知时间</TableHead>
                  <TableHead className="w-[100px] text-xs">通知医生</TableHead>
                  <TableHead className="w-[100px] text-xs">被通知人</TableHead>
                  <TableHead className="min-w-[150px] text-xs">处置建议</TableHead>
                  <TableHead className="w-[80px] sticky right-0 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.05)] text-xs">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={17} className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredResults.length > 0 ? filteredResults.map((res) => (
                  <TableRow key={res.ID} className="text-[10px] sm:text-xs">
                    <TableCell className="font-mono sticky left-0 bg-background z-10">{res.PERSONID}</TableCell>
                    <TableCell className="font-mono">{res.TJBHID || '-'}</TableCell>
                    <TableCell className="font-medium text-primary"><Link href={`/patients/${res.PERSONID}`} className="hover:underline">{res.PERSONNAME || '未知'}</Link></TableCell>
                    <TableCell>{res.SEX || '-'}</TableCell>
                    <TableCell>{res.AGE || '-'}</TableCell>
                    <TableCell>{res.PHONE || '-'}</TableCell>
                    <TableCell className="font-mono">{res.OCCURDATE || '-'}</TableCell>
                    <TableCell><Badge variant={res.ZYYCJGFL === 'A' ? 'destructive' : 'secondary'} className="text-[10px]">{res.ZYYCJGFL}类</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate" title={res.ZYYCJGXQ}>{res.ZYYCJGXQ}</TableCell>
                    <TableCell>{res.IS_NOTIFIED ? <Badge variant="outline" className="text-blue-600 border-blue-600 text-[10px]">是</Badge> : <Badge variant="outline" className="text-[10px]">否</Badge>}</TableCell>
                    <TableCell>{res.IS_HEALTH_EDU ? <Badge variant="outline" className="text-green-600 border-green-600 text-[10px]">是</Badge> : <Badge variant="outline" className="text-[10px]">否</Badge>}</TableCell>
                    <TableCell className="font-mono">{res.ZYYCJGTZRQ}</TableCell>
                    <TableCell className="font-mono">{res.ZYYCJGTZSJ}</TableCell>
                    <TableCell>{res.WORKER}</TableCell>
                    <TableCell>{res.ZYYCJGBTZR}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={res.ZYYCJGCZYJ}>{res.ZYYCJGCZYJ}</TableCell>
                    <TableCell className="sticky right-0 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                      <Button variant="ghost" size="sm" asChild><Link href={`/patients/${res.PERSONID}`}><Eye className="h-3.5 w-3.5" /></Link></Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={17} className="text-center py-20 text-muted-foreground italic">未检索到记录。</TableCell></TableRow>
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
