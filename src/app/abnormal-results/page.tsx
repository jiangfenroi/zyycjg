"use client"

import * as React from 'react'
import { Plus, Search, FileDown, FileUp, ExternalLink, Check, X } from 'lucide-react'
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
import { MOCK_RESULTS, MOCK_PERSONS } from '@/lib/mock-store'
import { useToast } from '@/hooks/use-toast'
import { AbnormalResult } from '@/lib/types'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

export default function AbnormalResultsPage() {
  const { toast } = useToast()
  const [results, setResults] = React.useState<AbnormalResult[]>(MOCK_RESULTS)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  
  const [formData, setFormData] = React.useState({
    PERSONID: '',
    TJBHID: '',
    ZYYCJGXQ: '',
    ZYYCJGFL: 'A' as 'A' | 'B',
    ZYYCJGCZYJ: '',
    ZYYCJGFKJG: '',
    ZYYCJGTZRQ: new Date().toISOString().split('T')[0],
    ZYYCJGTZSJ: new Date().toTimeString().slice(0, 5),
    WORKER: '',
    ZYYCJGBTZR: '',
  })

  const filteredResults = results.filter(res => {
    const person = MOCK_PERSONS.find(p => p.PERSONID === res.PERSONID);
    return (
      res.PERSONID.toLowerCase().includes(searchTerm.toLowerCase()) || 
      res.TJBHID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person?.PERSONNAME.includes(searchTerm)
    );
  })

  const handleImport = () => {
    toast({
      title: "系统提示",
      description: "批量导入接口已就绪，请上传标准格式 Excel 文件。",
    })
  }

  const handleExport = () => {
    const headers = ["姓名", "性别", "年龄", "联系电话", "体检时间", "分类", "结果", "通知", "健康宣教", "通知日期", "通知时间", "通知医生", "被通知人", "处置建议"];
    const rows = results.map(res => {
      const person = MOCK_PERSONS.find(p => p.PERSONID === res.PERSONID);
      return [
        person?.PERSONNAME || '',
        person?.SEX || '',
        person?.AGE || '',
        person?.PHONE || '',
        person?.OCCURDATE || '',
        res.ZYYCJGFL,
        res.ZYYCJGXQ.replace(/,/g, ' '),
        res.IS_NOTIFIED ? '是' : '否',
        res.IS_HEALTH_EDU ? '是' : '否',
        res.ZYYCJGTZRQ,
        res.ZYYCJGTZSJ,
        res.WORKER,
        res.ZYYCJGBTZR,
        res.ZYYCJGCZYJ.replace(/,/g, ' ')
      ];
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `重要异常结果登记表_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    
    toast({ 
      title: "导出成功", 
      description: "报表已生成并开始下载。" 
    })
  }

  const handleSubmit = () => {
    if (!formData.PERSONID || !formData.TJBHID) {
      toast({ variant: "destructive", title: "登记失败", description: "档案编号和体检编号为必填字段。" })
      return
    }

    const newResult: AbnormalResult = {
      ...formData,
      ID: `R${Date.now()}`,
      IS_NOTIFIED: true,
      IS_HEALTH_EDU: true,
    } as AbnormalResult

    setResults([newResult, ...results])
    setIsDialogOpen(false)
    
    toast({ 
      title: "登记成功", 
      description: `体检编号 ${formData.TJBHID} 的异常结果已入库。` 
    })

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
  }

  const openPACS = (id: string) => {
    if (typeof window !== 'undefined') {
      window.open(`http://172.16.201.61:7242/?ChtId=${id}`, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">重要异常结果登记</h1>
          <p className="text-muted-foreground mt-1">管理数据库记录，确保危急值与重要异常结果的闭环管理。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleImport}>
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
              <DialogHeader>
                <DialogTitle>重要异常结果入库登记</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="personid">档案编号</Label>
                    <Input 
                      id="personid" 
                      className="font-mono" 
                      placeholder="请输入档案编号..." 
                      value={formData.PERSONID}
                      onChange={e => setFormData({...formData, PERSONID: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tjbhid">体检编号</Label>
                    <Input 
                      id="tjbhid" 
                      className="font-mono" 
                      placeholder="请输入体检编号..." 
                      value={formData.TJBHID}
                      onChange={e => setFormData({...formData, TJBHID: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>异常分类</Label>
                  <Select 
                    value={formData.ZYYCJGFL}
                    onValueChange={v => setFormData({...formData, ZYYCJGFL: v as 'A' | 'B'})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">
                        <span className="font-semibold text-destructive">A类：</span>
                        需要立即干预的危急值 (威胁生命)
                      </SelectItem>
                      <SelectItem value="B">
                        <span className="font-semibold text-primary">B类：</span>
                        重要异常 (需进一步检查或治疗)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>异常详情</Label>
                  <Textarea 
                    className="min-h-[80px]" 
                    placeholder="请输入具体的异常结果描述..."
                    value={formData.ZYYCJGXQ}
                    onChange={e => setFormData({...formData, ZYYCJGXQ: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>处置意见</Label>
                  <Textarea 
                    className="min-h-[80px]" 
                    placeholder="请输入医学处置或随访建议..."
                    value={formData.ZYYCJGCZYJ}
                    onChange={e => setFormData({...formData, ZYYCJGCZYJ: e.target.value})}
                  />
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
                    <Input placeholder="执行通知的医生姓名" value={formData.WORKER} onChange={e => setFormData({...formData, WORKER: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>被通知人</Label>
                    <Input placeholder="家属或本人姓名" value={formData.ZYYCJGBTZR} onChange={e => setFormData({...formData, ZYYCJGBTZR: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                <Button onClick={handleSubmit}>确认提交</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">已登记异常结果</CardTitle>
            <div className="relative w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="搜索姓名、档案号、体检号..." 
                className="pl-8 h-9" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
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
                  <TableHead className="w-[100px]">健康宣教</TableHead>
                  <TableHead className="w-[120px]">通知日期</TableHead>
                  <TableHead className="w-[100px]">通知时间</TableHead>
                  <TableHead className="w-[100px]">通知医生</TableHead>
                  <TableHead className="w-[100px]">被通知人</TableHead>
                  <TableHead className="min-w-[200px]">处置建议</TableHead>
                  <TableHead className="w-[80px] sticky right-0 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.length > 0 ? filteredResults.map((res) => {
                  const person = MOCK_PERSONS.find(p => p.PERSONID === res.PERSONID)
                  return (
                    <TableRow key={res.ID} className="text-xs">
                      <TableCell className="font-medium">{person?.PERSONNAME || '未知'}</TableCell>
                      <TableCell>{person?.SEX || '-'}</TableCell>
                      <TableCell>{person?.AGE || '-'}</TableCell>
                      <TableCell>{person?.PHONE || '-'}</TableCell>
                      <TableCell>{person?.OCCURDATE || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={res.ZYYCJGFL === 'A' ? 'destructive' : 'secondary'} className="px-1.5 py-0">
                          {res.ZYYCJGFL}类
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate" title={res.ZYYCJGXQ}>
                        {res.ZYYCJGXQ}
                      </TableCell>
                      <TableCell>
                        {res.IS_NOTIFIED ? (
                          <div className="flex items-center text-green-600"><Check className="h-3 w-3 mr-1" />是</div>
                        ) : (
                          <div className="flex items-center text-muted-foreground"><X className="h-3 w-3 mr-1" />否</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {res.IS_HEALTH_EDU ? (
                          <div className="flex items-center text-green-600"><Check className="h-3 w-3 mr-1" />已完成</div>
                        ) : (
                          <div className="flex items-center text-muted-foreground"><X className="h-3 w-3 mr-1" />未完成</div>
                        )}
                      </TableCell>
                      <TableCell>{res.ZYYCJGTZRQ}</TableCell>
                      <TableCell>{res.ZYYCJGTZSJ}</TableCell>
                      <TableCell>{res.WORKER}</TableCell>
                      <TableCell>{res.ZYYCJGBTZR}</TableCell>
                      <TableCell className="max-w-[300px] truncate" title={res.ZYYCJGCZYJ}>
                        {res.ZYYCJGCZYJ}
                      </TableCell>
                      <TableCell className="sticky right-0 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openPACS(res.PERSONID)}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                }) : (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center py-12 text-muted-foreground">
                      未找到符合条件的记录。
                    </TableCell>
                  </TableRow>
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
