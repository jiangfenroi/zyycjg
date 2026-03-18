
"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, History, Users, FileText, TrendingUp, CheckCircle2, BarChart3, PieChart, Loader2, HelpCircle, Activity } from "lucide-react"
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

export default function Dashboard() {
  const [isClient, setIsClient] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState({
    totalPatients: 0,
    pendingFollowUps: 0,
    completedFollowUps: 0,
    aClassResults: 0,
    bClassResults: 0,
    totalResults: 0,
  })
  const [trendData, setTrendData] = React.useState<any[]>([])

  React.useEffect(() => {
    setIsClient(true)
    async function loadDashboardData() {
      setLoading(true)
      try {
        const [patients, results, followUps] = await Promise.all([
          DataService.getPatients(),
          DataService.getAbnormalResults(),
          DataService.getFollowUps()
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
    { name: "A类", value: stats.aClassResults, color: "hsl(var(--destructive))", description: "需立即临床干预，否则危及生命的异常结果。" },
    { name: "B类", value: stats.bClassResults, color: "hsl(var(--primary))", description: "需进一步检查确认或医学治疗的重要异常结果。" },
  ]

  if (!isClient || loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 font-medium">同步中心数据库...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">全院工作台仪表盘</h1>
          <p className="text-muted-foreground mt-1">MediTrack Connect 网络版中心服务器数据实时概览。</p>
        </div>
        <div className="flex items-center gap-3">
          <FollowUpNotifier />
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link href="/patients"><Activity className="mr-2 h-4 w-4" /> 快速档案搜索</Link>
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
            <p className="text-xs text-muted-foreground mt-1">全院数据中心同步记录</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-destructive shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待随访任务</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingFollowUps}</div>
            <p className="text-xs text-muted-foreground mt-1">含 {stats.aClassResults} 例 A类 预警</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">闭环完成率</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">累计完成随访 {stats.completedFollowUps} 例</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">重要异常登记</CardTitle>
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
              <CardTitle className="text-base flex items-center gap-2 font-bold text-primary">
                <BarChart3 className="h-4 w-4" />
                业务随访趋势
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[320px] pt-4">
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
                          <p className="font-bold text-secondary flex justify-between gap-4 pt-1 border-t"><span>随访率:</span> <span>{rate}%</span></p>
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
              <CardTitle className="text-base flex items-center gap-2 font-bold text-primary">
                <PieChart className="h-4 w-4" />
                异常分类占比
              </CardTitle>
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-bold text-destructive">A类</p>
                    <p className="text-xs mb-2">危及生命，需立即临床干预。</p>
                    <p className="font-bold text-primary">B类</p>
                    <p className="text-xs">重要异常，需定期复查或治疗。</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="h-[320px] flex flex-col items-center justify-center pt-4">
            <ResponsiveContainer width="100%" height="80%">
              <RePieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
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
                          <p className="font-bold mt-2">数量: {payload[0].value} 例</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="flex gap-6 text-xs mt-4">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle className="text-lg">快捷业务通道</CardTitle>
          <CardDescription>直接访问中心服务器常用的业务操作模块</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="h-24 flex-col gap-2 hover:bg-primary/5 hover:border-primary transition-all group" asChild>
            <Link href="/abnormal-results">
              <AlertCircle className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-bold">登记 A/B 类结果</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2 hover:bg-secondary/5 hover:border-secondary transition-all group" asChild>
            <Link href="/follow-ups">
              <History className="h-6 w-6 text-secondary group-hover:scale-110 transition-transform" />
              <span className="font-bold">重要异常随访</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2 hover:bg-muted transition-all group" asChild>
            <Link href="/reports">
              <FileText className="h-6 w-6 text-muted-foreground group-hover:scale-110 transition-transform" />
              <span className="font-bold">报告附件管理</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2 hover:bg-muted transition-all group" asChild>
            <Link href="/patients">
              <Users className="h-6 w-6 text-muted-foreground group-hover:scale-110 transition-transform" />
              <span className="font-bold">管理患者档案</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
