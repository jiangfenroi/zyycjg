
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
  CalendarDays
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
import { Badge } from '@/components/ui/badge'
import { DataService } from '@/services/data-service'
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend
} from "recharts"

export default function FollowUpRateAnalytics() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [analyticsData, setAnalyticsData] = React.useState<any[]>([])
  const [summary, setSummary] = React.useState({
    totalRegistered: 0,
    totalCompleted: 0,
    overallRate: 0
  })

  React.useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [results, followUps] = await Promise.all([
          DataService.getAbnormalResults(),
          DataService.getFollowUps()
        ])

        const months = [
          "01", "02", "03", "04", "05", "06", 
          "07", "08", "09", "10", "11", "12"
        ]

        const currentYear = new Date().getFullYear()
        
        const monthlyData = months.map(m => {
          // 统计基准：以通知日期所在的月份为准
          const registeredInMonth = results.filter(r => (r.ZYYCJGTZRQ || "").startsWith(`${currentYear}-${m}`))
          // 检查在该通知月中，有多少记录最终完成了随访（随访日期可以在任意时间）
          const completedInMonth = registeredInMonth.filter(r => 
            followUps.some(f => f.PERSONID === r.PERSONID && f.ZYYCJGTJBH === r.TJBHID)
          )
          
          const rate = registeredInMonth.length > 0 
            ? Math.round((completedInMonth.length / registeredInMonth.length) * 100) 
            : 0

          return {
            month: `${parseInt(m)}月`,
            registered: registeredInMonth.length,
            completed: completedInMonth.length,
            rate: rate
          }
        })

        setAnalyticsData(monthlyData)
        
        const totalReg = results.length
        const totalComp = followUps.length
        setSummary({
          totalRegistered: totalReg,
          totalCompleted: totalComp,
          overallRate: totalReg > 0 ? Math.round((totalComp / totalReg) * 100) : 0
        })
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return <div className="h-full w-full flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">随访闭环率年度分析</h1>
          <p className="text-sm text-muted-foreground">统计维度：按重要异常结果的【通知月份】归集随访完成情况</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> 累计异常登记</CardDescription>
            <CardTitle className="text-2xl">{summary.totalRegistered} <span className="text-xs font-normal text-muted-foreground">例</span></CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-secondary" /> 累计结案随访</CardDescription>
            <CardTitle className="text-2xl text-secondary">{summary.totalCompleted} <span className="text-xs font-normal text-muted-foreground">例</span></CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1 text-primary"><TrendingUp className="h-3 w-3" /> 总计随访闭环率</CardDescription>
            <CardTitle className="text-3xl text-primary font-bold">{summary.overallRate}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              随访率趋势图 (%)
            </CardTitle>
            <CardDescription>展示每月发现的异常结果最终完成随访的百分比</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                <Tooltip 
                   cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar name="随访闭环率" dataKey="rate" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              年度月度分析矩阵
            </CardTitle>
            <CardDescription>按通知月计算的精细化随访率列表</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>月份</TableHead>
                  <TableHead>异常发现</TableHead>
                  <TableHead>已闭环数</TableHead>
                  <TableHead className="text-right">当月最终闭环率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell className="font-mono text-xs">{row.registered}</TableCell>
                    <TableCell className="font-mono text-xs text-primary">{row.completed}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={row.rate > 80 ? 'default' : row.rate > 50 ? 'secondary' : 'outline'} className="text-[10px]">
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
