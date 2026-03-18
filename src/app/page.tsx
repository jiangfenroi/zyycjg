"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, History, Users, FileText, TrendingUp, CheckCircle2, Clock, BarChart3, PieChart, Loader2, HelpCircle, ShieldAlert } from "lucide-react"
import { FollowUpNotifier } from "@/components/follow-up-notifier"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  Pie, 
  PieChart as RePieChart,
  CartesianGrid
} from "recharts"
import { DataService } from "@/services/data-service"
import { TooltipProvider, Tooltip as UITooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { SystemLog } from "@/lib/types"

export default function Dashboard() {
  const [loading, setLoading] = React.useState(true)
  const [userRole, setUserRole] = React.useState<string | null>(null)
  const [stats, setStats] = React.useState({
    totalPatients: 0,
    pendingFollowUps: 0,
    completedFollowUps: 0,
    aClassResults: 0,
    bClassResults: 0,
    totalResults: 0,
  })
  const [trendData, setTrendData] = React.useState<any[]>([])
  const [logs, setLogs] = React.useState<SystemLog[]>([])

  React.useEffect(() => {
    async function loadDashboardData() {
      setLoading(true)
      try {
        const storedUser = localStorage.getItem('currentUser')
        if (storedUser) {
          setUserRole(JSON.parse(storedUser).ROLE)
        }

        const [patients, results, followUps, systemLogs] = await Promise.all([
          DataService.getPatients(),
          DataService.getAbnormalResults(),
          DataService.getFollowUps(),
          DataService.getLogs()
        ])

        const aClass = results.filter(r => r.ZYYCJGFL === 'A').length
        const bClass = results.filter(r => r.ZYYCJGFL === 'B').length
        
        const pending = results.filter(r => !followUps.some(f => f.PERSONID === r.PERSONID)).length

        setStats({
          totalPatients: patients.length,
          pendingFollowUps: pending,
          completedFollowUps: followUps.length,
          aClassResults: aClass,
          bClassResults: bClass,
          totalResults: results.length
        })

        setLogs(systemLogs)

        const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
        const currentYear = new Date().getFullYear().toString()
        
        const monthlyStats = months.map(m => {
          const monthLabel = `${parseInt(m)}月`
          const resultsInMonth = results.filter(r => {
            const date = r.ZYYCJGTZRQ || ""
            return date.includes(`-${m}-`) || date.startsWith(`${currentYear}/${m}/`) || date.includes(`/${m}/`)
          })
          
          const completedInMonth = resultsInMonth.filter(r => 
            followUps.some(f => f.PERSONID === r.PERSONID)
          ).length

          return {
            month: monthLabel,
            count: completedInMonth,
            total: resultsInMonth.length
          }
        })

        setTrendData(monthlyStats.slice(0, 6))

      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  const completionRate = (stats.pendingFollowUps + stats.completedFollowUps) > 0 
    ? Math.round((stats.completedFollowUps / (stats.pendingFollowUps + stats.completedFollowUps)) * 100) 
    : 0

  const categoryData = [
    { name: "A类", value: stats.aClassResults, color: "hsl(var(--destructive))", description: "需要立即进行临床干预，否则将危及生命或导致严重不良反应后果的异常结果。" },
    { name: "B类", value: stats.bClassResults, color: "hsl(var(--primary))", description: "需要临床进一步检查以确认诊断和（或）需要医学治疗的重要异常结果。" },
  ]

  const formatLogTime = (timeStr: string) => {
    const logDate = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - logDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
    return logDate.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">中心数据同步中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">工作台仪表盘</h1>
          <p className="text-muted-foreground mt-1">网络版中心服务器数据实时概览。</p>
        </div>
        <div className="flex items-center gap-4">
          <FollowUpNotifier />
          <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
            <Link href="/patients">快速档案搜索</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">累计档案总数</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">中心数据库所有患者记录</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-destructive shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待处理随访任务</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingFollowUps}</div>
            <p className="text-xs text-muted-foreground mt-1">含 {stats.aClassResults} 例 A 类预警</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">业务闭环完成率</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">已结案 {stats.completedFollowUps} 例</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">累计异常登记</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResults}</div>
            <p className="text-xs text-muted-foreground mt-1">历史录入中心数据库总量</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                重要异常结果随访趋势 (按通知日期)
              </CardTitle>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">统计标准：以通知日期为准</span>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const rate = data.total > 0 ? Math.round((data.count / data.total) * 100) : 0;
                      return (
                        <div className="bg-background border p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold border-b pb-1 mb-1">{data.month}</p>
                          <p className="text-primary flex justify-between gap-4"><span>已随访:</span> <span>{data.count} 例</span></p>
                          <p className="text-muted-foreground flex justify-between gap-4"><span>异常总数:</span> <span>{data.total} 例</span></p>
                          <p className="font-bold text-secondary flex justify-between gap-4 pt-1 border-t"><span>当月随访率:</span> <span>{rate}%</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                异常分类占比
              </CardTitle>
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-bold text-destructive">A类</p>
                    <p className="text-xs mb-2">需要立即进行临床干预，否则将危及生命或导致严重不良反应后果的异常结果。</p>
                    <p className="font-bold text-primary">B类</p>
                    <p className="text-xs">需要临床进一步检查以确认诊断和（或）需要医学治疗的重要异常结果。</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <RePieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border p-2 rounded-lg shadow-xl text-xs max-w-[200px]">
                          <p className="font-bold" style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
                          <p className="text-foreground mt-1">{payload[0].payload.description}</p>
                          <p className="font-bold mt-2">数量: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-xs mt-2">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>核心业务操作</CardTitle>
            <CardDescription>快捷访问中心数据库常用功能</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-24 flex-col gap-2 border-dashed border-primary/40 hover:bg-primary/5 hover:border-primary" asChild>
              <Link href="/abnormal-results">
                <AlertCircle className="h-6 w-6 text-primary" />
                <span>登记 A/B 类结果</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-dashed border-secondary/40 hover:bg-secondary/5 hover:border-secondary" asChild>
              <Link href="/follow-ups">
                <History className="h-6 w-6 text-secondary" />
                <span>执行待办随访</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-dashed border-muted-foreground/40" asChild>
              <Link href="/reports">
                <FileText className="h-6 w-6" />
                <span>上传检查报告</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-dashed border-muted-foreground/40" asChild>
              <Link href="/patients">
                <Users className="h-6 w-6" />
                <span>管理患者档案</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              系统实时日志
            </CardTitle>
            <CardDescription>仅系统管理员可查阅全院操作动态</CardDescription>
          </CardHeader>
          <CardContent>
            {userRole === 'admin' ? (
              <div className="space-y-6">
                {logs.length > 0 ? logs.map((log) => (
                  <div key={log.ID} className="flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      log.TYPE === 'alert' ? 'bg-destructive' : 
                      log.TYPE === 'completed' ? 'bg-secondary' : 
                      'bg-primary'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{log.OPERATOR}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{log.ACTION}</p>
                    </div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
                      {formatLogTime(log.LOG_TIME)}
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center text-xs text-muted-foreground italic">暂无系统操作记录</div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <ShieldAlert className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">权限受限</p>
                  <p className="text-xs text-muted-foreground">出于数据安全考虑，操作日志仅供管理员查阅。</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}