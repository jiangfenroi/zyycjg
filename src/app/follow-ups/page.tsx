"use client"

import * as React from 'react'
import { Search, Phone, History, MoreHorizontal, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { MOCK_TASKS, MOCK_PERSONS, MOCK_RESULTS, MOCK_FOLLOW_UPS } from '@/lib/mock-store'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function FollowUpsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = React.useState('pending')
  const [tasks, setTasks] = React.useState(MOCK_TASKS)
  const [selectedPatient, setSelectedPatient] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')

  // 模拟搜索
  const filteredTasks = tasks.filter(t => {
    const person = MOCK_PERSONS.find(p => p.PERSONID === t.PERSONID)
    return person?.PERSONNAME.includes(searchTerm) || t.PERSONID.includes(searchTerm)
  })

  const handleLogFollowUp = (id: string) => {
    setSelectedPatient(id)
  }

  const handleCompleteTask = () => {
    if (!selectedPatient) return;
    
    // 更新任务状态
    const updatedTasks = tasks.map(t => 
      t.PERSONID === selectedPatient ? { ...t, STATUS: 'completed' as const } : t
    );
    
    setTasks(updatedTasks);
    setSelectedPatient(null);
    
    toast({
      title: "随访已记录",
      description: "患者随访任务已更新为完成状态。",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">异常结果随访</h1>
        <p className="text-muted-foreground mt-1">
          基于已登记异常结果的随访任务中心，闭环管理后续诊疗。
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">待执行 ({filteredTasks.filter(t => t.STATUS === 'pending').length})</TabsTrigger>
            <TabsTrigger value="completed">已完成 ({filteredTasks.filter(t => t.STATUS === 'completed').length})</TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="搜索姓名或编号..." 
              className="pl-8 h-9" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="pending">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">待随访列表</CardTitle>
              <CardDescription>系统自动匹配的近期需要回访的异常案例。</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>应随访日期</TableHead>
                    <TableHead>患者信息</TableHead>
                    <TableHead className="w-[300px]">重要异常结果详情</TableHead>
                    <TableHead className="w-[200px]">处置建议</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.filter(t => t.STATUS === 'pending').map((task) => {
                    const person = MOCK_PERSONS.find(p => p.PERSONID === task.PERSONID)
                    const result = MOCK_RESULTS.find(r => r.PERSONID === task.PERSONID)
                    return (
                      <TableRow key={task.PERSONID}>
                        <TableCell>
                          <Badge variant="outline" className="text-destructive border-destructive">
                            {task.XCSFTIME}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Link 
                              href={`/patients/${task.PERSONID}`}
                              className="font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              {person?.PERSONNAME}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {person?.PHONE}
                            </div>
                            <Badge variant={result?.ZYYCJGFL === 'A' ? 'destructive' : 'secondary'} className="text-[10px]">
                              {result?.ZYYCJGFL}类异常
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                           <div className="text-xs bg-muted/30 p-2 rounded border border-dashed">
                             <div className="flex items-start gap-1 mb-1">
                               <AlertCircle className="h-3 w-3 mt-0.5 text-destructive shrink-0" />
                               <span className="font-semibold">详情：</span>
                             </div>
                             <p className="line-clamp-3 text-muted-foreground" title={result?.ZYYCJGXQ}>
                               {result?.ZYYCJGXQ || '暂无详细描述'}
                             </p>
                           </div>
                        </TableCell>
                        <TableCell>
                           <p className="text-xs text-primary italic">
                             {result?.ZYYCJGCZYJ || '待定'}
                           </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Button size="sm" onClick={() => handleLogFollowUp(task.PERSONID)}>
                              登记随访
                            </Button>
                            <Button variant="ghost" size="sm" asChild className="h-7 text-[10px]">
                               <Link href={`/patients/${task.PERSONID}`}>查看档案</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredTasks.filter(t => t.STATUS === 'pending').length === 0 && (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 opacity-50">所有随访任务已清零。</TableCell>
                     </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
             <CardHeader className="pb-3">
                <CardTitle className="text-lg">已完成记录</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>完成日期</TableHead>
                      <TableHead>患者姓名</TableHead>
                      <TableHead>随访方式</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.filter(t => t.STATUS === 'completed').map((task) => {
                       const person = MOCK_PERSONS.find(p => p.PERSONID === task.PERSONID)
                       return (
                        <TableRow key={task.PERSONID}>
                           <TableCell>{task.XCSFTIME}</TableCell>
                           <TableCell className="font-medium">{person?.PERSONNAME}</TableCell>
                           <TableCell>电话随访</TableCell>
                           <TableCell>
                             <div className="flex items-center gap-1 text-secondary">
                               <CheckCircle2 className="h-4 w-4" /> 已结案
                             </div>
                           </TableCell>
                           <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                 <Link href={`/patients/${task.PERSONID}?tab=followup`}>查看详情</Link>
                              </Button>
                           </TableCell>
                        </TableRow>
                       )
                    })}
                  </TableBody>
                </Table>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>随访结果登记 - {MOCK_PERSONS.find(p => p.PERSONID === selectedPatient)?.PERSONNAME}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>回访详细结果</Label>
              <Textarea className="min-h-[120px]" placeholder="详细记录患者目前情况、就诊经历、用药反馈等..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label>随访日期</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
               </div>
               <div className="space-y-2">
                  <Label>随访人员</Label>
                  <Input defaultValue="管理员" />
               </div>
            </div>
            <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
              <Checkbox id="further" />
              <Label htmlFor="further" className="cursor-pointer leading-none">是否已进一步病理检查或影像复查？</Label>
            </div>
            <div className="space-y-2">
              <Label>下次随访计划 (如有)</Label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPatient(null)}>取消</Button>
            <Button onClick={handleCompleteTask}>提交并结案</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
