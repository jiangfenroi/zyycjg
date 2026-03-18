"use client"

import * as React from 'react'
import { Search, Phone, History, Calendar, CheckSquare, MoreHorizontal } from 'lucide-react'
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
import { MOCK_TASKS, MOCK_PERSONS, MOCK_RESULTS } from '@/lib/mock-store'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function FollowUpsPage() {
  const [activeTab, setActiveTab] = React.useState('pending')
  const [selectedPatient, setSelectedPatient] = React.useState<string | null>(null)

  const handleLogFollowUp = (id: string) => {
    setSelectedPatient(id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">异常结果随访</h1>
        <p className="text-muted-foreground mt-1">
          根据预定时间表进行回访，记录随访结果及病理检查状态。
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">待随访任务</TabsTrigger>
            <TabsTrigger value="completed">已完成随访</TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="快速搜索患者..." className="pl-8 h-9" />
          </div>
        </div>

        <TabsContent value="pending">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">待随访列表</CardTitle>
              <CardDescription>默认首次随访为通知时间后一周，系统自动查询显示。</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>随访期限</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>联系电话</TableHead>
                    <TableHead>体检日期</TableHead>
                    <TableHead>异常分类</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_TASKS.filter(t => t.STATUS === 'pending').map((task) => {
                    const person = MOCK_PERSONS.find(p => p.PERSONID === task.PERSONID)
                    const result = MOCK_RESULTS.find(r => r.PERSONID === task.PERSONID)
                    return (
                      <TableRow key={task.PERSONID}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-destructive border-destructive">
                              {task.XCSFTIME}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{person?.PERSONNAME}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {person?.PHONE}
                          </div>
                        </TableCell>
                        <TableCell>{person?.OCCURDATE}</TableCell>
                        <TableCell>
                           <Badge variant={result?.ZYYCJGFL === 'A' ? 'destructive' : 'secondary'}>
                            {result?.ZYYCJGFL}类
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleLogFollowUp(task.PERSONID)}>
                            登记随访结果
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

        <TabsContent value="completed">
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <History className="h-12 w-12 mb-2 opacity-20" />
              <p>暂无已完成的随访历史记录</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>登记随访记录 - {MOCK_PERSONS.find(p => p.PERSONID === selectedPatient)?.PERSONNAME}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="mt-2">回访结果</Label>
              <Textarea className="col-span-3 min-h-[100px]" placeholder="详细记录患者目前情况、就诊经历等..." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label>随访日期</Label>
              <Input type="date" className="col-span-3" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label>随访人员</Label>
              <Input className="col-span-3" defaultValue="管理员" />
            </div>
            <div className="flex items-center gap-4 border p-3 rounded-md bg-muted/20">
              <Checkbox id="further" />
              <Label htmlFor="further" className="cursor-pointer">是否进一步病理检查 / 影像复查？</Label>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label>下次随访</Label>
              <Input type="date" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPatient(null)}>取消</Button>
            <Button onClick={() => setSelectedPatient(null)}>提交并更新任务</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
