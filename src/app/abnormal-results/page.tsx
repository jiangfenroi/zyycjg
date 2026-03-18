"use client"

import * as React from 'react'
import { Plus, Search, FileDown, FileUp, ClipboardList, ExternalLink } from 'lucide-react'
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
  const [isProcessing, setIsProcessing] = React.useState(false)
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

  const handleGenerateAdvice = async () => {
    if (!formData.ZYYCJGXQ) {
      toast({ title: "提示", description: "请先输入异常结果详情" })
      return
    }
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 600))
    
    try {
      const text = formData.ZYYCJGXQ;
      const keywords = ["建议", "复查", "结节", "钙化", "进一步", "检查", "占位", "异常"].filter(k => text.includes(k));
      const summary = text.length > 50 ? text.substring(0, 50) + "..." : text;
      
      let advice = "建议结合临床表现，由专业医师进行综合研判。";
      if (keywords.includes("结节") || keywords.includes("占位")) {
        advice = "检测到关键病变描述，建议立即协调专科医师会诊，并预约进一步影像学检查。";
      } else if (keywords.includes("复查")) {
        advice = "建议按照体检报告要求的时限进行定期随访复查。";
      }

      setFormData(prev => ({ 
        ...prev, 
        ZYYCJGCZYJ: `【内容摘要】${summary}\n\n【处置建议】${advice}` 
      }))
      
      toast({ title: "生成完毕", description: "已根据本地逻辑生成参考建议" })
    } catch (e) {
      toast({ variant: "destructive", title: "处理失败" })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmit = () => {
    if (!formData.PERSONID || !formData.TJBHID) {
      toast({ variant: "destructive", title: "提交失败", description: "档案编号和体检编号为必填项" })
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
      description: `体检编号 ${formData.TJBHID} 已成功登记` 
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
          <p className="text-muted-foreground mt-1">管理并登记体检过程中的关键异常发现。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileUp className="mr-2 h-4 w-4" /> 批量导入
          </Button>
          <Button variant="outline" size="sm">
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
                <DialogTitle>登记重要异常结果</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="personid">档案编号</Label>
                    <Input 
                      id="personid" 
                      className="col-span-3 font-mono" 
                      placeholder="PERSONID" 
                      value={formData.PERSONID}
                      onChange={e => setFormData({...formData, PERSONID: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tjbhid">体检编号</Label>
                    <Input 
                      id="tjbhid" 
                      className="col-span-3 font-mono" 
                      placeholder="TJBHID" 
                      value={formData.TJBHID}
                      onChange={e => setFormData({...formData, TJBHID: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label>异常分类</Label>
                  <Select 
                    value={formData.ZYYCJGFL}
                    onValueChange={v => setFormData({...formData, ZYYCJGFL: v as 'A' | 'B'})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">
                        <span className="font-semibold text-destructive">A类：</span>
                        需要立即进行临床干预，否则将危机生命或导致严重不良反应后果的异常结果
                      </SelectItem>
                      <SelectItem value="B">
                        <span className="font-semibold text-primary">B类：</span>
                        需要临床进一步检查以确认诊断和（或）需要医学治疗的重要异常结果
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="mt-2">异常详情</Label>
                  <Textarea 
                    className="col-span-3 min-h-[80px]" 
                    placeholder="请输入重要异常结果详情描述..."
                    value={formData.ZYYCJGXQ}
                    onChange={e => setFormData({...formData, ZYYCJGXQ: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <div className="space-y-2">
                    <Label>处置意见</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs h-8"
                      onClick={handleGenerateAdvice}
                      disabled={isProcessing}
                    >
                      <ClipboardList className="mr-1 h-3 w-3 text-secondary" />
                      辅助生成建议
                    </Button>
                  </div>
                  <Textarea 
                    className="col-span-3 min-h-[80px]" 
                    placeholder="请输入处置意见..."
                    value={formData.ZYYCJGCZYJ}
                    onChange={e => setFormData({...formData, ZYYCJGCZYJ: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="mt-2">反馈结果</Label>
                  <Textarea 
                    className="col-span-3 min-h-[60px]" 
                    placeholder="请输入被通知人反馈结果..."
                    value={formData.ZYYCJGFKJG}
                    onChange={e => setFormData({...formData, ZYYCJGFKJG: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label>通知日期</Label>
                    <Input className="col-span-3" type="date" value={formData.ZYYCJGTZRQ} onChange={e => setFormData({...formData, ZYYCJGTZRQ: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label>通知时间</Label>
                    <Input className="col-span-3" type="time" value={formData.ZYYCJGTZSJ} onChange={e => setFormData({...formData, ZYYCJGTZSJ: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label>通知人</Label>
                    <Input className="col-span-3" placeholder="通知医生姓名" value={formData.WORKER} onChange={e => setFormData({...formData, WORKER: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label>被通知人</Label>
                    <Input className="col-span-3" placeholder="家属或本人姓名" value={formData.ZYYCJGBTZR} onChange={e => setFormData({...formData, ZYYCJGBTZR: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                <Button onClick={handleSubmit}>提交登记</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">已登记异常结果列表</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索档案号、体检号..." className="pl-8 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>档案编号</TableHead>
                <TableHead>体检编号</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>分类</TableHead>
                <TableHead className="max-w-[200px]">异常结果详情</TableHead>
                <TableHead>通知日期/时间</TableHead>
                <TableHead>通知人/被通知人</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length > 0 ? results.map((res) => {
                const person = MOCK_PERSONS.find(p => p.PERSONID === res.PERSONID)
                return (
                  <TableRow key={res.ID}>
                    <TableCell className="font-mono text-xs">{res.PERSONID}</TableCell>
                    <TableCell className="font-mono text-xs">{res.TJBHID}</TableCell>
                    <TableCell className="font-medium">{person?.PERSONNAME || '未知'}</TableCell>
                    <TableCell>
                      <Badge variant={res.ZYYCJGFL === 'A' ? 'destructive' : 'secondary'}>
                        {res.ZYYCJGFL}类
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs" title={res.ZYYCJGXQ}>
                      {res.ZYYCJGXQ}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{res.ZYYCJGTZRQ} {res.ZYYCJGTZSJ}</TableCell>
                    <TableCell className="text-xs">{res.WORKER} / {res.ZYYCJGBTZR}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openPACS(res.PERSONID)}>
                          <ExternalLink className="h-4 w-4 mr-1" /> PACS
                        </Button>
                        <Button variant="outline" size="sm">编辑</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    暂无登记数据
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
