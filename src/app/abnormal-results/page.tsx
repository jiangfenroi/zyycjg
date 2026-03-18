
"use client"

import * as React from 'react'
import { Plus, Search, FileDown, FileUp, ExternalLink, Check, X, Loader2, HelpCircle, Eye } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

export default function AbnormalResultsPage() {
  const { toast } = useToast()
  const [results, setResults] = React.useState<AbnormalResult[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  
  const [formData, setFormData] = React.useState({
    PERSONID: '',
    TJBHID: '',
    ZYYCJGXQ: '',
    ZYYCJGFL: 'A' as 'A' | 'B',
    ZYYCJGCZYJ: '', // 处理意见
    ZYYCJGFKJG: '',
    ZYYCJGTZRQ: '',
    ZYYCJGTZSJ: '',
    WORKER: '',
    ZYYCJGBTZR: '',
    IS_HEALTH_EDU: true,
  })

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await DataService.getAbnormalResults()
      setResults(data)
    } catch (err) {
      toast({ variant: "destructive", title: "数据加载失败", description: "无法从中心数据库拉取记录。" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadData()
    
    // 初始化默认值
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
      res.TJBHID.toLowerCase().includes(searchLower) ||
      personName.toLowerCase().includes(searchLower)
    );
  })

  const handleExport = () => {
    if (results.length === 0) {
      toast({ title: "导出提示", description: "当前没有记录可供导出。" })
      return
    }

    const headers = ["档案编号", "体检编号", "姓名", "性别", "年龄", "电话号码", "分类", "异常结果详情", "健康宣教", "处理意见", "通知日期", "通知时间", "被通知人", "通知人"];
    
    const rows = results.map(res => [
      res.PERSONID,
      res.TJBHID,
      res.PERSONNAME || '未知',
      res.SEX || '-',
      res.AGE || '-',
      res.PHONE || '-',
      `${res.ZYYCJGFL}类`,
      `"${(res.ZYYCJGXQ || '').replace(/"/g, '""')}"`,
      res.IS_HEALTH_EDU ? '是' : '否',
      `"${(res.ZYYCJGCZYJ || '').replace(/"/g, '""')}"`,
      res.ZYYCJGTZRQ,
      res.ZYYCJGTZSJ,
      res.ZYYCJGBTZR,
      res.WORKER
    ]);
    
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `重要异常结果登记表_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "导出成功", description: "CSV 报表已生成并下载。" })
  }

  const handleSubmit = async () => {
    if (!formData.PERSONID || !formData.TJBHID) {
      toast({ variant: "destructive", title: "校验失败", description: "档案编号和体检编号为必填字段。" })
      return
    }

    setSubmitting(true)
    const newResult: AbnormalResult = {
      ...formData,
      ID: `R${Date.now()}`,
      IS_NOTIFIED: true,
    } as AbnormalResult

    const success = await DataService.addAbnormalResult(newResult)
    
    if (success) {
      toast({ title: "录入成功", description: `档案号 ${formData.PERSONID} 已同步至服务器。` })
      setIsDialogOpen(false)
      loadData()
      
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
      const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '';
      
      setFormData({
        PERSONID: '',
        TJBHID: '',
        ZYYCJGXQ: '',
        ZYYCJGFL: 'A',
        ZYYCJGCZYJ: '',
        ZYYCJGFKJG: '',
        ZYYCJGTZRQ: new Date().toISOString().split('T')[0],
        ZYYCJGTZSJ: new Date().toTimeString().slice(0, 5),
        WORKER: realName,
        ZYYCJGBTZR: '',
        IS_HEALTH_EDU: true,
      })
    } else {
      toast({ variant: "destructive", title: "数据库同步失败", description: "请检查网络连接或服务器状态。" })
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">重要异常结果登记</h1>
          <p className="text-muted-foreground mt-1">闭环管理业务异常结果，全院数据中心同步。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" /> 导出报表
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> 新增登记
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>重要异常结果入库登记</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>档案编号 (PERSONID)</Label>
                    <Input className="font-mono" value={formData.PERSONID} onChange={e => setFormData({...formData, PERSONID: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>体检编号 (TJBHID)</Label>
                    <Input className="font-mono" value={formData.TJBHID} onChange={e => setFormData({...formData, TJBHID: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>异常分类</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p><b>A类：</b>需立即临床干预，否则危及生命。</p>
                          <p className="mt-2"><b>B类：</b>需进一步检查确认或门诊治疗。</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select value={formData.ZYYCJGFL} onValueChange={v => setFormData({...formData, ZYYCJGFL: v as any})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">
                        <span className="font-semibold text-destructive">A类 (紧急干预)</span>
                      </SelectItem>
                      <SelectItem value="B">
                        <span className="font-semibold text-primary">B类 (复查随访)</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>重要异常结果详情</Label>
                  <Textarea className="min-h-[80px]" placeholder="详细记录检查发现的异常指标..." value={formData.ZYYCJGXQ} onChange={e => setFormData({...formData, ZYYCJGXQ: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>处理意见</Label>
                  <Textarea className="min-h-[60px]" placeholder="临床医生的初步处置建议或复查要求..." value={formData.ZYYCJGCZYJ} onChange={e => setFormData({...formData, ZYYCJGCZYJ: e.target.value})} />
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <Checkbox 
                    id="health_edu" 
                    checked={formData.IS_HEALTH_EDU} 
                    onCheckedChange={(checked) => setFormData({...formData, IS_HEALTH_EDU: !!checked})} 
                  />
                  <Label htmlFor="health_edu" className="cursor-pointer font-bold">已进行健康宣教</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>通知日期</Label>
                    <Input type="date" value={formData.ZYYCJGTZRQ} onChange={e => setFormData({...formData, ZYYCJGTZRQ: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>通知时间</Label>
                    <Input type="time" value={formData.ZYYCJGTZSJ} onChange={e => setFormData({...formData, ZYYCJGTZSJ: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>通知人/登记医生</Label>
                    <Input value={formData.WORKER} onChange={e => setFormData({...formData, WORKER: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>被通知人 (关系)</Label>
                    <Input value={formData.ZYYCJGBTZR} onChange={e => setFormData({...formData, ZYYCJGBTZR: e.target.value})} placeholder="本人 / 家属姓名" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "同步写入中心数据库"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">已登记异常结果数据库</CardTitle>
            <div className="relative w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="检索姓名、档案号、体检号..." className="pl-8 h-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px] sticky left-0 bg-muted/50 z-10">档案编号</TableHead>
                  <TableHead className="w-[120px]">体检编号</TableHead>
                  <TableHead className="w-[100px]">姓名</TableHead>
                  <TableHead className="w-[60px]">性别</TableHead>
                  <TableHead className="w-[60px]">年龄</TableHead>
                  <TableHead className="w-[120px]">电话号码</TableHead>
                  <TableHead className="w-[80px]">分类</TableHead>
                  <TableHead className="min-w-[200px]">异常详情</TableHead>
                  <TableHead className="w-[100px]">健康宣教</TableHead>
                  <TableHead className="min-w-[150px]">处理意见</TableHead>
                  <TableHead className="w-[110px]">通知日期</TableHead>
                  <TableHead className="w-[90px]">通知时间</TableHead>
                  <TableHead className="w-[100px]">被通知人</TableHead>
                  <TableHead className="w-[100px]">通知人</TableHead>
                  <TableHead className="w-[80px] sticky right-0 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={15} className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredResults.length > 0 ? filteredResults.map((res) => (
                  <TableRow key={res.ID} className="text-xs">
                    <TableCell className="font-mono sticky left-0 bg-background z-10">{res.PERSONID}</TableCell>
                    <TableCell className="font-mono">{res.TJBHID}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/patients/${res.PERSONID}`} className="text-primary hover:underline">
                        {res.PERSONNAME || '未知'}
                      </Link>
                    </TableCell>
                    <TableCell>{res.SEX || '-'}</TableCell>
                    <TableCell>{res.AGE || '-'}</TableCell>
                    <TableCell>{res.PHONE || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={res.ZYYCJGFL === 'A' ? 'destructive' : 'secondary'}>
                        {res.ZYYCJGFL}类
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={res.ZYYCJGXQ}>{res.ZYYCJGXQ}</TableCell>
                    <TableCell>
                      {res.IS_HEALTH_EDU ? (
                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">已宣教</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">未宣教</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={res.ZYYCJGCZYJ}>{res.ZYYCJGCZYJ}</TableCell>
                    <TableCell className="font-mono">{res.ZYYCJGTZRQ}</TableCell>
                    <TableCell className="font-mono">{res.ZYYCJGTZSJ}</TableCell>
                    <TableCell>{res.ZYYCJGBTZR}</TableCell>
                    <TableCell>{res.WORKER}</TableCell>
                    <TableCell className="sticky right-0 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="查看档案" asChild>
                          <Link href={`/patients/${res.PERSONID}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="PACS影像" onClick={() => window.open(`http://172.16.201.61:7242/?ChtId=${res.PERSONID}`, '_blank')}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={15} className="text-center py-20 text-muted-foreground italic">未发现符合条件的登记记录。</TableCell></TableRow>
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
