"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, History, Users, FileText, TrendingUp, CheckCircle2, BarChart3, PieChart, Activity, ArrowUpRight, RefreshCw, Calendar, Loader2 } from "lucide-react"
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

  const loadDashboardData = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [patients, results, followUps] = await Promise.all([
        DataService.getPatients(),
        DataService.getAbnormalResults(),
        DataService.getFollowUps()
      ])
      setData({ patients, results, followUps })
    } catch (err) {
      console.error("中心数据库同步中断", err)
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
    const today = new Date().toISOString().split('T')[0]
    
    const pending = results.filter(r => {
      if (r.STATUS === 'deceased') return false;
      const recordFollowUps = followUps.filter(f => f.PERSONID === r.PERSONID && f.ZYYCJGTJBH === r.TJBHID);
      const initialTargetDate = r.NEXT_DATE || r.ZYYCJGTZRQ;
      const initialPending = recordFollowUps.length === 0 && initialTargetDate <= today;
      const peDate = DataService.getPEDateFromID(r.TJBHID || '', r.ZYYCJGTZRQ);
      const oneYearMark = addYears(peDate, 1);
      const annualPending = today >= oneYearMark && !recordFollowUps.some(f => f.SFTIME >= oneYearMark);
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
    
    // 闭环率统计引擎：基于通知日期 (ZYYCJGTZRQ) 进行月度归集
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

  if (!isClient) {
    return (
      <div className="space-y-8 p-4 md:p-8 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded" />
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-7">
          <div className="md:col-span-4 h-80 bg-muted rounded-xl" />
          <div className="md:col-span-3 h-80 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">全院工作台</h1>
          <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-widest">物理同步 · 临床异常闭环中心</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => loadDashboardData()} disabled={loading} title="刷新全库数据">
             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <FollowUpNotifier />
          <Button variant="outline" size="sm" asChild className="hidden sm:flex shadow-sm font-bold">
            <Link href="/patients"><Activity className="mr-2 h-4 w-4" /> 档案中心</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "全院建档量", value: stats.totalPatients, icon: Users, color: "primary", label: "中心库活跃档案" },
          { title: "到期待随访", value: stats.pendingFollowUps, icon: AlertCircle, color: "destructive", label: "触发预警任务" },
          { title: "累计闭环率", value: `${stats.completionRate}%`, icon: CheckCircle2, color: "secondary", label: `已结案 ${stats.completedFollowUps} 例`, detail: true },
          { title: "异常登记总数", value: stats.totalResults, icon: TrendingUp, color: "amber-500", label: "历史累计流水" }
        ].map((item, idx) => (
          <Card key={idx} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{item.value.toLocaleString()}</div>}
              <div className="flex justify-between items-end mt-1">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.label}</p>
                {item.detail && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-bold" asChild>
                    <Link href="/analytics/follow-up-rate">趋势视图 <ArrowUpRight className="ml-0.5 h-2.5 w-2.5" /></Link>
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
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base flex items-center gap-2 font-bold text-primary">
                  <BarChart3 className="h-4 w-4" />
                  随访闭环率月度趋势 (%)
                </CardTitle>
                <p className="text-[10px] text-muted-foreground font-medium italic">基于通知日期 (ZYYCJGTZRQ) 计算登记与结案比例</p>
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}年度</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary opacity-20" /></div>
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
                          <div className="bg-background border rounded-lg p-3 shadow-xl text-[10px] space-y-1.5 min-w-[120px]">
                            <p className="font-bold border-b pb-1 mb-1 text-primary">{d.month} 指标摘要</p>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">异常登记:</span>
                              <span className="font-mono font-bold">{d.total} 例</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">随访结案:</span>
                              <span className="font-mono font-bold text-emerald-600">{d.count} 例</span>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-dashed">
                              <span className="font-bold">随访闭环率:</span>
                              <span className="font-mono font-bold text-primary">{d.rate}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24}>
                    {trendData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.rate > 80 ? 'hsl(var(--primary))' : entry.rate > 50 ? 'hsl(var(--secondary))' : 'hsl(var(--muted-foreground) / 0.5)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 font-bold text-primary"><PieChart className="h-4 w-4" /> 异常风险分布</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
             {loading ? <Skeleton className="h-40 w-40 rounded-full" /> : (
               <ResponsiveContainer width="100%" height="100%">
                 <RePieChart>
                   <Pie
                     data={[
                       { name: "A类", value: stats.aClassResults },
                       { name: "B类", value: stats.bClassResults }
                     ]}
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     <Cell fill="hsl(var(--primary))" />
                     <Cell fill="hsl(var(--secondary))" />
                   </Pie>
                   <Tooltip />
                 </RePieChart>
               </ResponsiveContainer>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
