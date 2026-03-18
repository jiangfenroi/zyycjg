"use client"

import * as React from 'react'
import { 
  Clock, 
  Search, 
  Loader2, 
  ShieldCheck, 
  Filter,
  FileText
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataService } from '@/services/data-service'
import { SystemLog } from '@/lib/types'

export default function SystemLogsPage() {
  const [logs, setLogs] = React.useState<SystemLog[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState('all')

  const fetchLogs = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await DataService.getLogs()
      setLogs(data)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.OPERATOR.includes(searchTerm) || log.ACTION.includes(searchTerm)
    const matchesType = typeFilter === 'all' || log.TYPE === typeFilter
    return matchesSearch && matchesType
  })

  const formatLogTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">系统操作日志</h1>
        <p className="text-muted-foreground mt-1">全量审计系统业务操作流水，仅管理员可见。</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">日志筛选</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">关键字搜索</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="搜索人员或内容..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">日志类型</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="alert">预警提醒 (A类)</SelectItem>
                  <SelectItem value="update">业务更新</SelectItem>
                  <SelectItem value="completed">随访结案</SelectItem>
                  <SelectItem value="system">系统管理</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                操作流水详情
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-blue-50">
                <ShieldCheck className="h-3 w-3 mr-1" /> 中心数据库同步
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[180px]">操作时间</TableHead>
                  <TableHead className="w-[120px]">操作人员</TableHead>
                  <TableHead className="w-[100px]">类型</TableHead>
                  <TableHead>具体动作描述</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredLogs.length > 0 ? filteredLogs.map((log) => (
                  <TableRow key={log.ID} className="text-xs">
                    <TableCell className="font-mono text-muted-foreground">{formatLogTime(log.LOG_TIME)}</TableCell>
                    <TableCell className="font-medium">{log.OPERATOR}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${
                        log.TYPE === 'alert' ? 'border-destructive text-destructive' : 
                        log.TYPE === 'completed' ? 'border-secondary text-secondary' : 
                        'border-primary text-primary'
                      }`}>
                        {log.TYPE === 'alert' ? 'A类预警' : 
                         log.TYPE === 'completed' ? '已结案' : 
                         log.TYPE === 'system' ? '系统' : '更新'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{log.ACTION}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">未检索到相关日志记录</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
