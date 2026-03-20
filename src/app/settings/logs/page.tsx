
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

  const filteredLogs = React.useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.OPERATOR.includes(searchTerm) || log.ACTION.includes(searchTerm)
      const matchesType = typeFilter === 'all' || log.TYPE === typeFilter
      return matchesSearch && matchesType
    })
  }, [logs, searchTerm, typeFilter])

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
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">全量审计日志</h1>
        <p className="text-muted-foreground mt-1">系统业务操作全生命周期流水，确保数据可溯源。</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1 h-fit shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">审计过滤器</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">关键字检索</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="操作员、内容..." 
                  className="pl-8 text-xs" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">操作类型</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部操作</SelectItem>
                  <SelectItem value="alert">重要异常预警</SelectItem>
                  <SelectItem value="update">业务流水更新</SelectItem>
                  <SelectItem value="completed">随访闭环结案</SelectItem>
                  <SelectItem value="system">系统架构配置</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 font-bold">
                <Clock className="h-4 w-4 text-primary" />
                中心数据库操作流水
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-background">
                <ShieldCheck className="h-3 w-3 mr-1 text-primary" /> 安全审计模式
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[180px] text-xs">时间戳</TableHead>
                  <TableHead className="w-[120px] text-xs">执行人员</TableHead>
                  <TableHead className="w-[100px] text-xs">业务分类</TableHead>
                  <TableHead className="text-xs">操作内容详情</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary opacity-30" /></TableCell></TableRow>
                ) : filteredLogs.length > 0 ? filteredLogs.map((log) => (
                  <TableRow key={log.ID} className="text-[11px] hover:bg-muted/5 transition-colors">
                    <TableCell className="font-mono text-muted-foreground">{formatLogTime(log.LOG_TIME)}</TableCell>
                    <TableCell className="font-bold text-primary">{log.OPERATOR}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border-opacity-50 ${
                        log.TYPE === 'alert' ? 'border-destructive text-destructive bg-destructive/5' : 
                        log.TYPE === 'completed' ? 'border-secondary text-secondary bg-secondary/5' : 
                        'border-primary text-primary bg-primary/5'
                      }`}>
                        {log.TYPE === 'alert' ? '重要预警' : 
                         log.TYPE === 'completed' ? '已结案' : 
                         log.TYPE === 'system' ? '系统配置' : '业务更新'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">{log.ACTION}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic text-xs">中心库中暂无匹配的审计记录</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
