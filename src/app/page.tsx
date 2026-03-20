
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, History, Users, FileText, TrendingUp, CheckCircle2, BarChart3, PieChart, Loader2, Activity, ArrowUpRight } from "lucide-react"
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
        
        const pending = results.filter(r => 
          !followUps.some(f => f.PERSONID === r.PERSONID && f.ZYYCJGTJBH === r.TJBHID)
        ).length

        setStats({
          totalPatients: patients.length,
          pendingFollowUps: pending,
          completedFollowUps: followUps.length,
          aClassResults: aClass,
          bClassResults: bClass,
          totalResults: results.length
        })

        const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
        const monthlyStats = months.map(m => {
          const monthLabel = `${parseInt(m)}月`
          const resultsInMonth = results.filter(r => (r.ZYYCJGTZRQ || "").includes(`-${m}-`))
          const completedInMonth = resultsInMonth.filter(r => 
            followUps.some(f => f.PERSONID === r.PERSONID && f.ZYYCJGTJBH === r.TJBHID)
          ).length

          return {
            month: monthLabel,
            count: completedInMonth,
            total: resultsInMonth.length
          }
        })

        setTrendData(monthlyStats.slice(-6))

      } catch (err) {
        console.error("Dashboard analytics error:", err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  const completionRate = stats.totalResults > 0 
    ? Math.round((stats.completedFollowUps / stats.totalResults) * 100) 
    : 0

  const categoryData = [
    { name: "A类", value: stats.aClassResults, color: "hsl(var(--primary))" },
    { name: "B类", value: stats.bClassResults, color: "hsl(var(--secondary))" },
  ]

  if (!isClient || loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 font-medium">中心数据库统计分析引擎初始化中</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">全院工作台</h1>
          <p className="text-muted-foreground mt-1">医疗数据中心实时概览</p>
        </div>
        <div className="flex items-center gap-3">
          <FollowUpNotifier />
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link href="/patients"><Activity className="mr-2 h-4 w-4" /> 档案管理</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">累计建档量</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">记录总数</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待随访任务</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingFollowUps}</div>
            <p className="text-xs text-muted-foreground mt-1">当前未结案</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary shadow-sm relative">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">闭环完成率</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <div className="flex justify-between items-end mt-1">
              <p className="text-xs text-muted-foreground">累计结案 {stats.completedFollowUps} 例</p>
              <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" asChild>
                <Link href="/analytics/follow-up-rate">查看年度详情 <ArrowUpRight className="ml-0.5 h-2.5 w-2.5" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">异常登记总数</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResults}</div>
            <p className="text-xs text-muted-foreground mt-1">流水总量</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 font-bold text-primary">
              <BarChart3 className="h-4 w-4" />
              随访结案月度趋势
            </CardTitle>
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
                      return (
                        <div className="bg-background border p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold border-b pb-1 mb-1">{data.month}</p>
                          <p className="text-primary flex justify-between gap-4"><span>已随访:</span> <span>{data.count} 例</span></p>
                          <p className="text-muted-foreground flex justify-between gap-4"><span>异常发现:</span> <span>{data.total} 例</span></p>
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
            <CardTitle className="text-base flex items-center gap-2 font-bold text-primary">
              <PieChart className="h-4 w-4" />
              风险分类分布
            </CardTitle>
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
                        <div className="bg-background border p-2 rounded-lg shadow-xl text-xs">
                          <p className="font-bold" style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
                          <p className="font-bold mt-1">数量: {payload[0].value} 例</p>
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
              <AlertCircle className="h-6 w-6 text-primary" />
              <span className="font-bold">登记异常结果</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2 hover:bg-secondary/5 hover:border-secondary transition-all group" asChild>
            <Link href="/follow-ups">
              <History className="h-6 w-6 text-secondary" />
              <span className="font-bold">随访闭环</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2 hover:bg-muted transition-all group" asChild>
            <Link href="/reports">
              <FileText className="h-6 w-6 text-muted-foreground" />
              <span className="font-bold">报告附件</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2 hover:bg-muted transition-all group" asChild>
            <Link href="/patients">
              <Users className="h-6 w-6 text-muted-foreground" />
              <span className="font-bold">电子病历档案</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
