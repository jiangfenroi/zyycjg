
"use client"

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  CalendarDays,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'
import { DataService } from '@/services/data-service'
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from "recharts"

export default function FollowUpRateAnalytics() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear().toString())
  const [data, setData] = React.useState<{ results: any[], followUps: any[] }>({ results: [], followUps: [] })

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  }, []);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true)
    try {
      const [results, followUps] = await Promise.all([
        DataService.getAbnormalResults(),
        DataService.getFollowUps()
      ])
      setData({ results, followUps })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const { analyticsData, summary } = React.useMemo(() => {
    const { results, followUps } = data
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
    
    const monthly = months.map(m => {
      const prefix = `${selectedYear}-${m}`
      const registeredInMonth = results.filter(r => (r.ZYYCJGTZRQ || "").startsWith(prefix))
      const completedInMonth = registeredInMonth.filter(r => 
        followUps.some(f => f.PERSONID === r.PERSONID && f.ZYYCJGTJBH === r.TJBHID)
      )
      
      return {
        month: `${parseInt(m)}月`,
        registered: registeredInMonth.length,
        completed: completedInMonth.length,
        rate: registeredInMonth.length > 0 ? Math.round((completedInMonth.length / registeredInMonth.length) * 100) : 0
      }
    })

    const filteredResultsForYear = results.filter(r => (r.ZYYCJGTZRQ || "").startsWith(selectedYear))
    const totalReg = filteredResultsForYear.length
    const totalComp = filteredResultsForYear.filter(r => 
      followUps.some(f => f.PERSONID === r.PERSONID && f.ZYYCJGTJBH === r.TJBHID)
    ).length
    
    return {
      analyticsData: monthly,
      summary: {
        totalRegistered: totalReg,
        totalCompleted: totalComp,
        overallRate: totalReg > 0 ? Math.round((totalComp / totalReg) * 100) : 0
      }
    }
  }, [data, selectedYear])

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">随访闭环率分析</h1>
            <p className="text-sm text-muted-foreground">统计维度：按发现月归集随访结果</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="选择年份" />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y}>{y}年度</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {selectedYear}年度 累计异常登记</CardDescription>
            <CardTitle className="text-2xl">{summary.totalRegistered} <span className="text-xs font-normal text-muted-foreground">例</span></CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-secondary" /> {selectedYear}年度 累计随访闭环</CardDescription>
            <CardTitle className="text-2xl text-secondary">{summary.totalCompleted} <span className="text-xs font-normal text-muted-foreground">例</span></CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1 text-primary font-bold"><TrendingUp className="h-3 w-3" /> {selectedYear}年度 闭环率</CardDescription>
            <CardTitle className="text-3xl text-primary font-bold">{summary.overallRate}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {selectedYear}年度 随访率月度趋势 (%)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                <Tooltip 
                   cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar name="随访闭环率" dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {selectedYear}年度 指标矩阵
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>月份</TableHead>
                  <TableHead>异常量</TableHead>
                  <TableHead>结案量</TableHead>
                  <TableHead className="text-right">完成率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.map((row) => (
                  <TableRow key={row.month} className="hover:bg-muted/10">
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell className="font-mono text-xs">{row.registered}</TableCell>
                    <TableCell className="font-mono text-xs text-primary">{row.completed}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={row.rate > 80 ? 'default' : row.rate > 50 ? 'secondary' : 'outline'} className="text-[10px] px-2 py-0">
                        {row.rate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
