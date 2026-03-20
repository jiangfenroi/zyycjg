
"use client"

import * as React from 'react'
import { Search, Loader2, ClipboardCheck, FileDown, Link as LinkIcon, AlertTriangle } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { DataService } from '@/services/data-service'
import { Person, AbnormalResult, FollowUp } from '@/lib/types'

export default function FollowUpsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [persons, setPersons] = React.useState<Person[]>([])
  const [abnormalResults, setAbnormalResults] = React.useState<AbnormalResult[]>([])
  const [followUps, setFollowUps] = React.useState<FollowUp[]>([])
  const [selectedResult, setSelectedResult] = React.useState<AbnormalResult | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)

  const [followUpForm, setFollowUpForm] = React.useState({
    HFresult: '',
    SFTIME: '',
    SFSJ: '',
    SFGZRY: '',
    jcsf: false,
    XCSFTIME: ''
  })

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [p, r, f] = await Promise.all([
        DataService.getPatients(),
        DataService.getAbnormalResults(),
        DataService.getFollowUps()
      ])
      setPersons(p)
      setAbnormalResults(r)
      setFollowUps(f)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    setIsMounted(true)
    loadData()
  }, [loadData])

  React.useEffect(() => {
    if (selectedResult) {
      const storedUser = localStorage.getItem('currentUser');
      const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '操作员';
      setFollowUpForm(prev => ({ 
        ...prev, 
        SFTIME: new Date().toISOString().split('T')[0],
        SFSJ: new Date().toTimeString().slice(0, 5),
        SFGZRY: realName 
      }))
    }
  }, [selectedResult])

  const today = new Date().toISOString().split('T')[0]

  const pendingResults = abnormalResults.filter(res => {
    const hasFollowUp = followUps.some(f => f.PERSONID === res.PERSONID && f.ZYYCJGTJBH === res.TJBHID)
    if (hasFollowUp) return false
    if (!res.NEXT_DATE) return true 
    return res.NEXT_DATE <= today
  })

  const filteredPending = pendingResults.filter(res => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (res.PERSONNAME || '').toLowerCase().includes(searchLower) || 
      res.PERSONID.toLowerCase().includes(searchLower)
    )
  })

  const filteredCompleted = followUps.filter(f => {
    const searchLower = searchTerm.toLowerCase();
    const person = persons.find(p => p.PERSONID === f.PERSONID)
    return (
      (person?.PERSONNAME || '').toLowerCase().includes(searchLower) || 
      f.PERSONID.toLowerCase().includes(searchLower)
    )
  })

  const handleCompleteTask = async () => {
    if (!selectedResult || !followUpForm.HFresult) {
      toast({ variant: "destructive", title: "校验失败", description: "随访记录详情为必填项" })
      return
    }
    setSubmitting(true)
    try {
      const success = await DataService.addFollowUp({
        ID: `F${Date.now()}`,
        PERSONID: selectedResult.PERSONID,
        ZYYCJGTJBH: selectedResult.TJBHID,
        HFresult: followUpForm.HFresult,
        SFTIME: followUpForm.SFTIME,
        SFSJ: followUpForm.SFSJ,
        SFGZRY: followUpForm.SFGZRY,
        jcsf: followUpForm.jcsf,
        XCSFTIME: followUpForm.XCSFTIME
      })

      if (success) {
        toast({ title: "随访已结案" })
        setSelectedResult(null)
        loadData()
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!isMounted) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">标准化随访闭环工作台</h1>
          <p className="text-muted-foreground mt-1">临床路径驱动的任务管理引擎</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="检索患者姓名..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">待处理任务</TabsTrigger>
          <TabsTrigger value="completed">历史结案流水</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>患者</TableHead>
                      <TableHead>执行路径</TableHead>
                      <TableHead className="text-destructive font-bold">预定触发日期</TableHead>
                      <TableHead className="min-w-[250px]">异常详情</TableHead>
                      <TableHead className="text-right">管理操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : filteredPending.length > 0 ? filteredPending.map((res) => (
                      <TableRow key={res.ID} className="text-xs">
                        <TableCell className="font-bold">{res.PERSONNAME || '未知'}</TableCell>
                        <TableCell>
                          {res.PATH_NAME ? (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700">{res.PATH_NAME}</Badge>
                              {res.PATH_URL && (
                                <a href={res.PATH_URL} target="_blank" className="text-blue-500 hover:scale-110 transition-transform">
                                  <LinkIcon className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          ) : '未指定路径'}
                        </TableCell>
                        <TableCell className="font-mono text-destructive font-bold">
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 animate-pulse" />
                            {res.NEXT_DATE || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 max-w-[250px] truncate" title={res.ZYYCJGXQ}>{res.ZYYCJGXQ}</TableCell>
                        <TableCell className="text-right"><Button size="sm" onClick={() => setSelectedResult(res)}><ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> 登记闭环</Button></TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">目前暂无到期随访计划</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <Card>
             <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>患者</TableHead>
                      <TableHead>回访结论</TableHead>
                      <TableHead>结案时间</TableHead>
                      <TableHead>经办人</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompleted.map((f) => {
                      const person = persons.find(p => p.PERSONID === f.PERSONID)
                      return (
                        <TableRow key={f.ID} className="text-xs">
                          <TableCell className="font-medium">{person?.PERSONNAME || '未知'}</TableCell>
                          <TableCell className="max-w-[400px] truncate">{f.HFresult}</TableCell>
                          <TableCell className="font-mono">{f.SFTIME} {f.SFSJ}</TableCell>
                          <TableCell>{f.SFGZRY}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>随访闭环结案登记</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
              <p>关联路径：<span className="font-bold">{selectedResult?.PATH_NAME || '无'}</span></p>
              <p>异常摘要：<span className="text-muted-foreground">"{selectedResult?.ZYYCJGXQ}"</span></p>
            </div>
            <div className="space-y-2">
              <Label>随访回访结果详情</Label>
              <Textarea placeholder="请详细记录与患者的沟通结果及处置方案..." className="min-h-[120px]" value={followUpForm.HFresult} onChange={e => setFollowUpForm({...followUpForm, HFresult: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2"><Label>结案日期</Label><Input type="date" value={followUpForm.SFTIME} onChange={e => setFollowUpForm({...followUpForm, SFTIME: e.target.value})} /></div>
               <div className="space-y-2"><Label>结案时间</Label><Input type="time" value={followUpForm.SFSJ} onChange={e => setFollowUpForm({...followUpForm, SFSJ: e.target.value})} /></div>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-blue-50/50 rounded">
                <Checkbox id="jcsf" checked={followUpForm.jcsf} onCheckedChange={(v) => setFollowUpForm({...followUpForm, jcsf: !!v})} />
                <Label htmlFor="jcsf" className="text-xs text-blue-700">标记为：已完成计划要求的复查或病理检查</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedResult(null)}>取消</Button>
            <Button onClick={handleCompleteTask} disabled={submitting}>确认提交至中心库</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
