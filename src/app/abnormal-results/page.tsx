"use client"

import * as React from 'react'
import { Plus, Search, FileDown, FileUp, ExternalLink } from 'lucide-react'
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
    ZYYCJGTZRQ: '',
    ZYYCJGTZSJ: '',
    WORKER: '',
    ZYYCJGBTZR: '',
  })

  // 模拟搜索功能
  const filteredResults = results.filter(res => 
    res.PERSONID.toLowerCase().includes(searchTerm.toLowerCase()) || 
    res.TJBHID.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleImport = () => {
    toast({
      title: "系统提示",
      description: "SP_ZYJG 批量导入接口已就绪，请上传标准格式 Excel 文件。",
    })
  }

  // 模拟导出 CSV
  const handleExport = () => {
    const headers = ["PERSONID", "TJBHID", "分类", "结果详情", "通知日期", "通知人"];
    const rows = results.map(r => [
      r.PERSONID, 
      r.TJBHID, 
      r.ZYYCJGFL, 
      r.ZYYCJGXQ.replace(/,/g, ' '), 
      r.ZYYCJGTZRQ, 
      r.WORKER
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `重要异常结果报表_${new Date().toLocaleDateString()}.csv`);
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
      ZYYCJGTZRQ: '',
      ZYYCJGTZSJ: '',
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
          <p className="text-muted-foreground mt-1">SP_ZYJG 核心数据库管理，支持 A/B 类危急值登记。</p>
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
                    <Label htmlFor="personid">档案编号 (PERSONID)</Label>
                    <Input 
                      id="personid" 
                      className="font-mono" 
                      placeholder="D00000..." 
                      value={formData.PERSONID}
                      onChange={e => setFormData({...formData, PERSONID: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tjbhid">体检编号 (TJBHID)</Label>
                    <Input 
                      id="tjbhid" 
                      className="font-mono" 
                      placeholder="TJ202..." 
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
                        重要异常 (需进一步检查或门诊治疗)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>异常详情 (ZYYCJGXQ)</Label>
                  <Textarea 
                    className="min-h-[80px]" 
                    placeholder="请输入具体的异常结果描述..."
                    value={formData.ZYYCJGXQ}
                    onChange={e => setFormData({...formData, ZYYCJGXQ: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>处置意见 (ZYYCJGCZYJ)</Label>
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
                    <Label>通知人 (WORKER)</Label>
                    <Input placeholder="执行通知的医务人员" value={formData.WORKER} onChange={e => setFormData({...formData, WORKER: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>被通知人 (ZYYCJGBTZR)</Label>
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
                placeholder="搜索档案号、体检号..." 
                className="pl-8 h-9" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>档案编号</TableHead>
                <TableHead>体检编号</TableHead>
                <TableHead>患者姓名</TableHead>
                <TableHead>分类</TableHead>
                <TableHead className="max-w-[200px]">异常摘要</TableHead>
                <TableHead>通知时间</TableHead>
                <TableHead>操作人</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.length > 0 ? filteredResults.map((res) => {
                const person = MOCK_PERSONS.find(p => p.PERSONID === res.PERSONID)
                return (
                  <TableRow key={res.ID}>
                    <TableCell className="font-mono text-xs">{res.PERSONID}</TableCell>
                    <TableCell className="font-mono text-xs">{res.TJBHID}</TableCell>
                    <TableCell className="font-medium">{person?.PERSONNAME || '未匹配'}</TableCell>
                    <TableCell>
                      <Badge variant={res.ZYYCJGFL === 'A' ? 'destructive' : 'secondary'}>
                        {res.ZYYCJGFL}类
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs" title={res.ZYYCJGXQ}>
                      {res.ZYYCJGXQ}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{res.ZYYCJGTZRQ} {res.ZYYCJGTZSJ}</TableCell>
                    <TableCell className="text-xs">{res.WORKER}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openPACS(res.PERSONID)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">编辑</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    未找到符合条件的记录。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
