
"use client"

import * as React from 'react'
import { Plus, Search, Eye, Loader2 } from 'lucide-react'
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
    NEXT_DATE: '',
    IS_HEALTH_EDU: true,
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

  const handleSubmit = async () => {
    if (!formData.PERSONID || !formData.ZYYCJGXQ) {
      toast({ variant: "destructive", title: "校验失败", description: "档案编号及异常详情为必填项" })
      return
    }
    setSubmitting(true)
    try {
      // 检查档案是否存在，不存在则自动创建
      const patients = await DataService.getPatients()
      const exists = patients.some(p => p.PERSONID === formData.PERSONID)
      if (!exists) {
        await DataService.addPatient({
          PERSONID: formData.PERSONID,
          PERSONNAME: '新登记患者',
          SEX: '男',
          AGE: 0,
          PHONE: '待补充',
          OCCURDATE: new Date().toISOString().split('T')[0],
          OPTNAME: formData.WORKER
        } as Person)
        toast({ title: "自动建档", description: "该编号不存在，系统已自动创建基础档案" })
      }

      const success = await DataService.addAbnormalResult({ ...formData, ID: `R${Date.now()}` } as AbnormalResult)
      if (success) {
        toast({ title: "登记成功", description: "数据已录入至中心远程库" })
        setIsDialogOpen(false)
        loadData()
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!isMounted) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">重要异常结果登记</h1>
          <p className="text-muted-foreground mt-1">记录全院临床发现的重要异常流水</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" /> 新增登记</Button></DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader><DialogTitle>重要异常结果中心化登记</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>档案编号</Label><Input value={formData.PERSONID} onChange={e => setFormData({...formData, PERSONID: e.target.value})} placeholder="输入编号，若不存在将自动创建档案" /></div>
                  <div className="space-y-2"><Label>体检编号</Label><Input value={formData.TJBHID} onChange={e => setFormData({...formData, TJBHID: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><Label>异常详情</Label><Textarea value={formData.ZYYCJGXQ} onChange={e => setFormData({...formData, ZYYCJGXQ: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-destructive font-bold">预定下次随访日期</Label>
                    <Input type="date" value={formData.NEXT_DATE} className="border-destructive/20" onChange={e => setFormData({...formData, NEXT_DATE: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>结果分类</Label>
                    <Select value={formData.ZYYCJGFL} onValueChange={v => setFormData({...formData, ZYYCJGFL: v as any})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="A">A类</SelectItem><SelectItem value="B">B类</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>经办人员</Label><Input value={formData.WORKER} readOnly className="bg-muted" /></div>
                  <div className="flex items-center gap-2 pt-8 col-span-2">
                    <Checkbox id="notified" checked={formData.IS_NOTIFIED} onCheckedChange={(v) => setFormData({...formData, IS_NOTIFIED: !!v})} />
                    <Label htmlFor="notified">已完成首诊通知及健康宣教</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12">
                   {submitting ? <Loader2 className="animate-spin" /> : "同步至远程数据库"}
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
                  <TableHead className="min-w-[250px]">异常详情</TableHead>
                  <TableHead className="w-[120px] text-destructive font-bold">预定随访</TableHead>
                  <TableHead className="w-[110px]">登记日期</TableHead>
                  <TableHead className="w-[80px] sticky right-0 bg-background text-right">档案</TableHead>
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
