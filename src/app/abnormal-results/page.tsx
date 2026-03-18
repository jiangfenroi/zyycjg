"use client"

import * as React from 'react'
import { Plus, Search, FileDown, FileUp, ExternalLink, Check, X, Loader2, HelpCircle } from 'lucide-react'
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
    ZYYCJGCZYJ: '',
    ZYYCJGFKJG: '',
    ZYYCJGTZRQ: '',
    ZYYCJGTZSJ: '',
    WORKER: '',
    ZYYCJGBTZR: '',
  })

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await DataService.getAbnormalResults()
      setResults(data)
    } catch (err) {
      toast({ variant: "destructive", title: "数据加载失败", description: "无法从中心数据库获取记录。" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadData()
    // 客户端初始化默认值
    setFormData(prev => ({
      ...prev,
      ZYYCJGTZRQ: new Date().toISOString().split('T')[0],
      ZYYCJGTZSJ: new Date().toTimeString().slice(0, 5),
    }))
  }, [loadData])

  const filteredResults = results.filter(res => {
    const searchLower = searchTerm.toLowerCase();
    const personName = res.PERSONNAME || '';
    return (
      res.PERSONID.toLowerCase().includes(searchLower) || 
      res.TJBHID.toLowerCase().includes(searchLower) ||
      personName.includes(searchTerm)
    );
  })

  const handleExport = () => {
    if (results.length === 0) {
      toast({ title: "导出提示", description: "当前没有记录可供导出。" })
      return
    }

    const headers = ["姓名", "性别", "年龄", "联系电话", "体检时间", "分类", "异常详情", "是否通知", "健康宣教", "通知日期", "通知时间", "通知医生", "被通知人", "处置建议"];
    
    const rows = results.map(res => [
      res.PERSONNAME || '未知',
      res.SEX || '-',
      res.AGE || '-',
      res.PHONE || '-',
      res.OCCURDATE || '-',
      `${res.ZYYCJGFL}类`,
      `"${(res.ZYYCJGXQ || '').replace(/"/g, '""')}"`,
      res.IS_NOTIFIED ? '是' : '否',
      res.IS_HEALTH_EDU ? '是' : '否',
      res.ZYYCJGTZRQ,
      res.ZYYCJGTZSJ,
      res.WORKER,
      res.ZYYCJGBTZR,
      `"${(res.ZYYCJGCZYJ || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MediTrack_重要异常结果报表_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "导出成功", description: "报表已开始下载。" })
  }

  const handleSubmit = async () => {
    if (!formData.PERSONID || !formData.TJBHID) {
      toast({ variant: "destructive", title: "校验失败", description: "档案编号和体检编号为必填。" })
      return
    }

    setSubmitting(true)
    const newResult: AbnormalResult = {
      ...formData,
      ID: `R${Date.now()}`,
      IS_NOTIFIED: true,
      IS_HEALTH_EDU: true,
    } as AbnormalResult

    const success = await DataService.addAbnormalResult(newResult)
    
    if (success) {
      toast({ title: "登记成功", description: `体检编号 ${formData.TJBHID} 已录入数据库。` })
      setIsDialogOpen(false)
      loadData()
      setFormData({
        PERSONID: '',
        TJBHID: '',
        ZYYCJGXQ: '',
        ZYYCJGFL: 'A',
        ZYYCJGCZYJ: '',
        ZYYCJGFKJG: '',
        ZYYCJGTZRQ: new Date().toISOString().split('T')[0],
        ZYYCJGTZSJ: new Date().toTimeString().slice(0, 5),
        WORKER: '',
        ZYYCJGBTZR: '',
      })
    } else {
      toast({ variant: "destructive", title: "数据库写入失败" })
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">重要异常结果登记</h1>
          <p className="text-muted-foreground mt-1">闭环管理危急值与重要异常结果，数据全网同步。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast({ title: "批量导入", description: "该功能目前由管理员在服务器端执行。" })}>
            <FileUp className="mr-2 h-4 w-4" /> 批量导入
          </Button>
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
              <DialogHeader><DialogTitle>异常结果入库登记</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>档案编号</Label>
                    <Input className="font-mono" value={formData.PERSONID} onChange={e => setFormData({...formData, PERSONID: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>体检编号</Label>
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
                          <p><b>A类：</b>需要立即进行临床干预，否则将危及生命或导致严重不良反应后果的异常结果。</p>
                          <p className="mt-2"><b>B类：</b>需要临床进一步检查以确认诊断和（或）需要医学治疗的重要异常结果。</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select value={formData.ZYYCJGFL} onValueChange={v => setFormData({...formData, ZYYCJGFL: v as any})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">
                        <div className="flex flex-col">
                          <span className="font-semibold text-destructive">A类：危急值</span>
                          <span className="text-[10px] text-muted-foreground">需立即临床干预，危及生命风险</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="B">
                        <div className="flex flex-col">
                          <span className="font-semibold text-primary">B类：重要异常</span>
                          <span className="text-[10px] text-muted-foreground">需进一步检查确认诊断或医学治疗</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>异常详情</Label>
                  <Textarea className="min-h-[80px]" placeholder="请详细描述临床发现的异常体征或实验室指标..." value={formData.ZYYCJGXQ} onChange={e => setFormData({...formData, ZYYCJGXQ: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>处置意见</Label>
                  <Textarea className="min-h-[80px]" placeholder="记录医生的建议，如：立即住院、门诊复查、急诊干预等..." value={formData.ZYYCJGCZYJ} onChange={e => setFormData({...formData, ZYYCJGCZYJ: e.target.value})} />
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
                    <Label>通知医生</Label>
                    <Input value={formData.WORKER} onChange={e => setFormData({...formData, WORKER: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>被通知人</Label>
                    <Input value={formData.ZYYCJGBTZR} onChange={e => setFormData({...formData, ZYYCJGBTZR: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "确认提交"}
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
              <Input placeholder="搜索姓名、档案号、体检号..." className="pl-8 h-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full whitespace-nowrap">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">姓名</TableHead>
                  <TableHead className="w-[60px]">性别</TableHead>
                  <TableHead className="w-[60px]">年龄</TableHead>
                  <TableHead className="w-[120px]">联系电话</TableHead>
                  <TableHead className="w-[120px]">体检时间</TableHead>
                  <TableHead className="w-[80px]">分类</TableHead>
                  <TableHead className="min-w-[200px]">结果</TableHead>
                  <TableHead className="w-[80px]">通知</TableHead>
                  <TableHead className="w-[80px]">宣教</TableHead>
                  <TableHead className="w-[120px]">通知日期</TableHead>
                  <TableHead className="w-[100px]">通知时间</TableHead>
                  <TableHead className="w-[100px]">通知医生</TableHead>
                  <TableHead className="w-[100px]">被通知人</TableHead>
                  <TableHead className="min-w-[200px]">处置建议</TableHead>
                  <TableHead className="w-[80px] sticky right-0 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={15} className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredResults.length > 0 ? filteredResults.map((res) => (
                  <TableRow key={res.ID} className="text-xs">
                    <TableCell className="font-medium">{res.PERSONNAME || '未知'}</TableCell>
                    <TableCell>{res.SEX || '-'}</TableCell>
                    <TableCell>{res.AGE || '-'}</TableCell>
                    <TableCell>{res.PHONE || '-'}</TableCell>
                    <TableCell>{res.OCCURDATE || '-'}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant={res.ZYYCJGFL === 'A' ? 'destructive' : 'secondary'} className="cursor-help">
                              {res.ZYYCJGFL}类
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {res.ZYYCJGFL === 'A' ? '危急值：需立即进行临床干预' : '重要异常：需要临床进一步检查或治疗'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate" title={res.ZYYCJGXQ}>{res.ZYYCJGXQ}</TableCell>
                    <TableCell>{res.IS_NOTIFIED ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground" />}</TableCell>
                    <TableCell>{res.IS_HEALTH_EDU ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground" />}</TableCell>
                    <TableCell>{res.ZYYCJGTZRQ}</TableCell>
                    <TableCell>{res.ZYYCJGTZSJ}</TableCell>
                    <TableCell>{res.WORKER}</TableCell>
                    <TableCell>{res.ZYYCJGBTZR}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={res.ZYYCJGCZYJ}>{res.ZYYCJGCZYJ}</TableCell>
                    <TableCell className="sticky right-0 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(`http://172.16.201.61:7242/?ChtId=${res.PERSONID}`, '_blank')}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={15} className="text-center py-20 text-muted-foreground">暂无符合条件的登记结果。</TableCell></TableRow>
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
