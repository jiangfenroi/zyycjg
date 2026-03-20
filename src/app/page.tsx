"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, History, Users, FileText, TrendingUp, CheckCircle2, BarChart3, PieChart, Activity, ArrowUpRight, RefreshCw } from "lucide-react"
import { FollowUpNotifier } from "@/components/follow-up-notifier"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
  const [data, setData] = React.useState<{
    patients: any[],
    results: any[],
    followUps: any[]
  }>({ patients: [], results: [], followUps: [] })

  const loadDashboardData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [patients, results, followUps] = await Promise.all([
        DataService.getPatients(),
        DataService.getAbnormalResults(),
        DataService.getFollowUps()
      ])
      setData({ patients, results, followUps })
    } catch (err) {
      console.error("Dashboard data fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    setIsClient(true)
    loadDashboardData()
  }, [loadDashboardData])

  const stats = React.useMemo(() => {
    const { results, followUps, patients } = data
    const aClass = results.filter(r => r.ZYYCJGFL === 'A').length
    const bClass = results.filter(r => r.ZYYCJGFL === 'B').length
    const pending = results.filter(r => 
      !followUps.some(f => f.PERSONID === r.PERSONID && f.ZYYCJGTJBH === r.TJBHID)
    ).length
    
    return {
      totalPatients: patients.length,
      pendingFollowUps: pending,
      completedFollowUps: followUps.length,
      aClassResults: aClass,
      bClassResults: bClass,
      totalResults: results.length,
      completionRate: results.length > 0 ? Math.round((followUps.length / results.length) * 100) : 0
    }
  }, [data])

  const trendData = React.useMemo(() => {
    const { results, followUps } = data
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
    const currentYear = new Date().getFullYear()
    
    return months.map(m => {
      const prefix = `${currentYear}-${m}`
      const resultsInMonth = results.filter(r => (r.ZYYCJGTZRQ || "").startsWith(prefix))
      const completedForMonth = resultsInMonth.filter(r => 
        followUps.some(f => f.PERSONID === r.PERSONID && f.ZYYCJGTJBH === r.TJBHID)
      ).length

      return {
        month: `${parseInt(m)}月`,
        rate: resultsInMonth.length > 0 ? Math.round((completedForMonth / resultsInMonth.length) * 100) : 0,
        count: completedForMonth,
        total: resultsInMonth.length
      }
    })
  }, [data])

  const categoryData = React.useMemo(() => [
    { name: "A类", value: stats.aClassResults, color: "hsl(var(--primary))" },
    { name: "B类", value: stats.bClassResults, color: "hsl(var(--secondary))" },
  ], [stats])

  if (!isClient) return null

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">全院工作台</h1>
          <p className="text-muted-foreground mt-1 text-sm">医疗数据中心实时概览</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={loadDashboardData} disabled={loading} title="同步中心库数据">
             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <FollowUpNotifier />
          <Button variant="outline" size="sm" asChild className="hidden sm:flex shadow-sm">
            <Link href="/patients"><Activity className="mr-2 h-4 w-4" /> 档案管理</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "累计建档量", value: stats.totalPatients, icon: Users, color: "primary", label: "全院档案总数" },
          { title: "待处理随访", value: stats.pendingFollowUps, icon: AlertCircle, color: "destructive", label: "当前未结案任务" },
          { title: "闭环完成率", value: `${stats.completionRate}%`, icon: CheckCircle2, color: "secondary", label: `累计结案 ${stats.completedFollowUps} 例`, detail: true },
          { title: "异常结果流水", value: stats.totalResults, icon: TrendingUp, color: "amber-500", label: "流水数据总量" }
        ].map((item, idx) => (
          <Card key={idx} className={`border-l-4 border-l-${item.color} shadow-sm overflow-hidden`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className={`h-4 w-4 text-${item.color === 'amber-500' ? 'amber-500' : 'primary'}`} />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{item.value.toLocaleString()}</div>}
              <div className="flex justify-between items-end mt-1">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                {item.detail && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" asChild>
                    <Link href="/analytics/follow-up-rate">趋势详情 <ArrowUpRight className="ml-0.5 h-2.5 w-2.5" /></Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 font-bold text-primary">
              <BarChart3 className="h-4 w-4" />
              月度闭环率趋势 (按通知月份回溯)
            </CardTitle>
            <CardDescription className="text-xs">反映当月发现的异常最终完成随访的比例</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] pt-4">
            {loading ? (
              <div className="w-full h-full flex flex-col gap-4">
                <div className="flex-1 flex items-end gap-2">
                  {[...Array(12)].map((_, i) => <Skeleton key={i} className="flex-1" style={{ height: `${Math.random() * 80 + 20}%` }} />)}
                </div>
                <div className="flex justify-between">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-10" />)}
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-background border p-3 rounded-lg shadow-xl text-xs space-y-1">
                            <p className="font-bold border-b pb-1 mb-1 text-primary">{d.month}</p>
                            <p className="flex justify-between gap-6"><span>闭环率:</span> <span className="font-bold">{d.rate}%</span></p>
                            <p className="text-muted-foreground flex justify-between gap-6"><span>发现总数:</span> <span>{d.total} 例</span></p>
                            <p className="text-muted-foreground flex justify-between gap-6"><span>已结案:</span> <span>{d.count} 例</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 font-bold text-primary">
              <PieChart className="h-4 w-4" />
              异常结果风险构成
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] flex flex-col items-center justify-center pt-4">
            {loading ? (
              <Skeleton className="h-40 w-40 rounded-full" />
            ) : (
              <>
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
                      animationDuration={1000}
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
                      <span className="font-medium text-muted-foreground">{item.name}: <span className="text-foreground font-bold">{item.value}</span></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed border-2 bg-muted/5">
        <CardHeader>
          <CardTitle className="text-lg">业务快捷引擎</CardTitle>
          <CardDescription className="text-xs">直接接入中心服务器核心业务流水模块</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "异常结果登记", icon: AlertCircle, href: "/abnormal-results", color: "primary" },
            { label: "随访闭环管理", icon: History, href: "/follow-ups", color: "secondary" },
            { label: "电子报告查询", icon: FileText, href: "/reports", color: "muted-foreground" },
            { label: "全院病历档案", icon: Users, href: "/patients", color: "muted-foreground" }
          ].map((btn, i) => (
            <Button key={i} variant="outline" className={`h-24 flex-col gap-2 hover:bg-${btn.color}/5 hover:border-${btn.color} transition-all group shadow-sm`} asChild>
              <Link href={btn.href}>
                <btn.icon className={`h-6 w-6 text-${btn.color} group-hover:scale-110 transition-transform`} />
                <span className="font-bold text-sm">{btn.label}</span>
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
