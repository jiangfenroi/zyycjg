
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, History, Users, FileText, TrendingUp, CheckCircle2, BarChart3, PieChart, Activity, ArrowUpRight, RefreshCw, Calendar } from "lucide-react"
import { FollowUpNotifier } from "@/components/follow-up-notifier"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

const addYears = (dateStr: string, years: number) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().split('T')[0];
};

export default function Dashboard() {
  const [isClient, setIsClient] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear().toString())
  const [data, setData] = React.useState<{
    patients: any[],
    results: any[],
    followUps: any[]
  }>({ patients: [], results: [], followUps: [] })

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  }, []);

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
      console.error("全院数据同步异常", err)
    } finally {
      setIsClient(true)
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const stats = React.useMemo(() => {
    const { results, followUps, patients } = data
    const aClass = results.filter(r => r.ZYYCJGFL === 'A').length
    const bClass = results.filter(r => r.ZYYCJGFL === 'B').length
    const today = new Date().toISOString().split('T')[0]
    
    const pending = results.filter(r => {
      if (r.STATUS === 'deceased') return false;

      const recordFollowUps = followUps.filter(f => f.PERSONID === r.PERSONID && f.ZYYCJGTJBH === r.TJBHID);
      
      // 初次随访 (T[通知] + 7)
      const hasInitialFollowUp = recordFollowUps.length > 0;
      const initialPending = !hasInitialFollowUp && (r.NEXT_DATE || r.ZYYCJGTZRQ) <= today;

      // 年度复查 (T[体检] + 365)
      const peDate = DataService.getPEDateFromID(r.TJBHID || '', r.ZYYCJGTZRQ);
      const oneYearMark = addYears(peDate, 1);
      const hasAnnualFollowUp = recordFollowUps.some(f => f.SFTIME >= oneYearMark);
      const annualPending = today >= oneYearMark && !hasAnnualFollowUp;

      return initialPending || annualPending;
    }).length
    
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
    
    return months.map(m => {
      const prefix = `${selectedYear}-${m}`
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
  }, [data, selectedYear])

  const categoryData = React.useMemo(() => [
    { name: "A类 (即时)", value: stats.aClassResults, color: "hsl(var(--primary))" },
    { name: "B类 (常规)", value: stats.bClassResults, color: "hsl(var(--secondary))" },
  ], [stats])

  if (!isClient) return null

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">全院工作台</h1>
          <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-widest">重要异常结果中心化管理流水</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={loadDashboardData} disabled={loading} title="从中心数据库同步全量数据">
             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <FollowUpNotifier />
          <Button variant="outline" size="sm" asChild className="hidden sm:flex shadow-sm">
            <Link href="/patients"><Activity className="mr-2 h-4 w-4" /> 档案中心</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "全院建档量", value: stats.totalPatients, icon: Users, color: "primary", label: "中心库档案总数" },
          { title: "到期待随访", value: stats.pendingFollowUps, icon: AlertCircle, color: "destructive", label: "含年度自动提醒" },
          { title: "随访闭环率", value: `${stats.completionRate}%`, icon: CheckCircle2, color: "secondary", label: `累计结案 ${stats.completedFollowUps} 例`, detail: true },
          { title: "异常结果登记", value: stats.totalResults, icon: TrendingUp, color: "amber-500", label: "全量历史登记流水" }
        ].map((item, idx) => (
          <Card key={idx} className={`border-l-4 border-l-${item.color === 'amber-500' ? 'amber-500' : 'primary'} shadow-sm hover:shadow-md transition-shadow`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold">{item.title}</CardTitle>
              <item.icon className={`h-4 w-4 text-${item.color === 'amber-500' ? 'amber-500' : 'primary'}`} />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{item.value.toLocaleString()}</div>}
              <div className="flex justify-between items-end mt-1">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.label}</p>
                {item.detail && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-bold" asChild>
                    <Link href="/analytics/follow-up-rate">趋势详情 <ArrowUpRight className="ml-0.5 h-2.5 w-2.5" /></Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 shadow-sm border-t-2 border-t-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2 font-bold text-primary">
                  <BarChart3 className="h-4 w-4" />
                  随访闭环率年度趋势 (%)
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">全等级异常结果覆盖 · 中心库实时归集</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[100px] h-8 text-xs">
                    <SelectValue placeholder="选择年份" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y}>{y}年</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[320px] pt-4">
            {loading ? (
              <div className="w-full h-full flex flex-col gap-4">
                <div className="flex-1 flex items-end gap-2">
                  {[...Array(12)].map((_, i) => <Skeleton key={i} className="flex-1" style={{ height: `${Math.random() * 80 + 20}%` }} />)}
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-background border p-3 rounded-lg shadow-xl text-[11px] space-y-1 border-primary/20">
                            <p className="font-bold border-b pb-1 mb-1 text-primary">{selectedYear}年{d.month}统计摘要</p>
                            <div className="space-y-0.5">
                               <p className="flex justify-between gap-6"><span>随访闭环率:</span> <span className="font-bold text-primary">{d.rate}%</span></p>
                               <p className="text-muted-foreground flex justify-between gap-6"><span>月度登记:</span> <span>{d.total} 例</span></p>
                               <p className="text-muted-foreground flex justify-between gap-6"><span>年度结案:</span> <span>{d.count} 例</span></p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 shadow-sm border-t-2 border-t-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 font-bold text-primary">
              <PieChart className="h-4 w-4" />
              全院风险分类分布
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">基于临床 A/B 等级归档</CardDescription>
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
                      paddingAngle={4}
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
                            <div className="bg-background border p-2 rounded-lg shadow-xl text-xs border-primary/20">
                              <p className="font-bold" style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
                              <p className="font-bold mt-1 text-primary">档案总数: {payload[0].value} 例</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="flex gap-6 text-[11px] mt-4 font-bold">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground uppercase tracking-widest">{item.name}: <span className="text-foreground">{item.value}</span></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed border-2 bg-muted/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg font-bold">全院中心化业务模块</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">临床路径驱动的物理同步引擎</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "重要异常登记", icon: AlertCircle, href: "/abnormal-results", color: "primary" },
            { label: "到期随访闭环", icon: History, href: "/follow-ups", color: "secondary" },
            { label: "电子报告中心", icon: FileText, href: "/reports", color: "muted-foreground" },
            { label: "全院病历档案", icon: Users, href: "/patients", color: "muted-foreground" }
          ].map((btn, i) => (
            <Button key={i} variant="outline" className={`h-20 flex-col gap-1.5 hover:bg-primary/5 hover:border-primary transition-all group shadow-sm`} asChild>
              <Link href={btn.href}>
                <btn.icon className={`h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300`} />
                <span className="font-bold text-xs uppercase tracking-widest">{btn.label}</span>
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
