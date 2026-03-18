"use client"

import * as React from 'react'
import { Plus, Search, FileDown, FileUp, Sparkles, ExternalLink } from 'lucide-react'
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

export default function AbnormalResultsPage() {
  const { toast } = useToast()
  const [results, setResults] = React.useState(MOCK_RESULTS)
  const [isSummarizing, setIsSummarizing] = React.useState(false)
  const [formData, setFormData] = React.useState({
    PERSONID: '',
    ZYYCJGXQ: '',
    ZYYCJGFL: 'A',
    ZYYCJGCZYJ: '',
    ZYYCJGTZRQ: '',
    ZYYCJGTZSJ: '',
  })

  // 客户端模拟 AI 摘要功能（为了支持静态导出，不使用服务器端流程）
  const handleAISummarize = async () => {
    if (!formData.ZYYCJGXQ) {
      toast({ title: "提示", description: "请先输入异常结果详情" })
      return
    }
    setIsSummarizing(true)
    
    // 模拟网络处理延迟
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    try {
      const text = formData.ZYYCJGXQ;
      // 模拟简单的 AI 提取逻辑
      const keywords = ["建议", "复查", "结节", "钙化", "进一步", "检查"].filter(k => text.includes(k));
      const summary = text.length > 40 ? text.substring(0, 40) + "..." : text;
      const advice = keywords.length > 0 
        ? `针对"${keywords.join('、')}"等关键词，建议遵医嘱进行专项复查。`
        : "建议结合临床表现，由专业医师进行综合研判。";

      setFormData(prev => ({ 
        ...prev, 
        ZYYCJGCZYJ: `【AI 摘要】${summary}\n\n【辅助建议】${advice}\n\n[注意：此摘要由本地辅助算法生成]` 
      }))
      
      toast({ title: "处理完成", description: "已通过辅助算法生成摘要建议" })
    } catch (e) {
      toast({ variant: "destructive", title: "摘要处理失败" })
    } finally {
      setIsSummarizing(false)
    }
  }

  const openPACS = (id: string) => {
    window.open(`http://172.16.201.61:7242/?ChtId=${id}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">重要异常结果登记</h1>
          <p className="text-muted-foreground mt-1">管理并跟进体检过程中的关键异常发现。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileUp className="mr-2 h-4 w-4" /> 批量导入
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" /> 导出报表
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> 新增登记
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>登记重要异常结果</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="personid">档案编号</Label>
                  <Input 
                    id="personid" 
                    className="col-span-3" 
                    placeholder="输入患者档案ID" 
                    value={formData.PERSONID}
                    onChange={e => setFormData({...formData, PERSONID: e.target.value})}
                  />
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
                      <SelectItem value="A">A类 (高度疑似重大疾病)</SelectItem>
                      <SelectItem value="B">B类 (需要临床进一步明确)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="mt-2">详情描述</Label>
                  <Textarea 
                    className="col-span-3 min-h-[100px]" 
                    placeholder="请输入异常结果详细描述..."
                    value={formData.ZYYCJGXQ}
                    onChange={e => setFormData({...formData, ZYYCJGXQ: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <div className="space-y-2">
                    <Label>智能辅助</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs h-8"
                      onClick={handleAISummarize}
                      disabled={isSummarizing}
                    >
                      <Sparkles className="mr-1 h-3 w-3 text-secondary" />
                      {isSummarizing ? '分析中...' : '快速建议'}
                    </Button>
                  </div>
                  <Textarea 
                    className="col-span-3 min-h-[100px]" 
                    placeholder="辅助摘要将在此生成..."
                    value={formData.ZYYCJGCZYJ}
                    onChange={e => setFormData({...formData, ZYYCJGCZYJ: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Label>通知日期</Label>
                    <Input type="date" value={formData.ZYYCJGTZRQ} onChange={e => setFormData({...formData, ZYYCJGTZRQ: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Label>通知时间</Label>
                    <Input type="time" value={formData.ZYYCJGTZSJ} onChange={e => setFormData({...formData, ZYYCJGTZSJ: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">取消</Button>
                <Button onClick={() => toast({ title: "保存成功", description: "记录已存入数据库" })}>提交登记</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">已登记列表</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索姓名或档案号..." className="pl-8 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>档案号</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>分类</TableHead>
                <TableHead className="max-w-xs">重要异常结果详情</TableHead>
                <TableHead>通知日期</TableHead>
                <TableHead>被通知人</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((res) => {
                const person = MOCK_PERSONS.find(p => p.PERSONID === res.PERSONID)
                return (
                  <TableRow key={res.ID}>
                    <TableCell className="font-medium">{res.PERSONID}</TableCell>
                    <TableCell>{person?.PERSONNAME}</TableCell>
                    <TableCell>
                      <Badge variant={res.ZYYCJGFL === 'A' ? 'destructive' : 'secondary'}>
                        {res.ZYYCJGFL}类
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate" title={res.ZYYCJGXQ}>
                      {res.ZYYCJGXQ}
                    </TableCell>
                    <TableCell>{res.ZYYCJGTZRQ} {res.ZYYCJGTZSJ}</TableCell>
                    <TableCell>{res.ZYYCJGBTZR}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openPACS(res.PERSONID)}>
                          <ExternalLink className="h-4 w-4 mr-1" /> PACS
                        </Button>
                        <Button variant="outline" size="sm">查看</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
