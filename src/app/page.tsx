"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, History, Users, FileText, TrendingUp, CheckCircle2, Clock, BarChart3, PieChart } from "lucide-react"
import { FollowUpNotifier } from "@/components/follow-up-notifier"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MOCK_PERSONS, MOCK_TASKS, MOCK_RESULTS } from "@/lib/mock-store"
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function Dashboard() {
  // 基础统计数据
  const totalPatients = MOCK_PERSONS.length;
  const pendingTasks = MOCK_TASKS.filter(t => t.STATUS === 'pending').length;
  const completedTasks = MOCK_TASKS.filter(t => t.STATUS === 'completed').length;
  const totalTasks = MOCK_TASKS.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const aClassCount = MOCK_RESULTS.filter(r => r.ZYYCJGFL === 'A').length;
  const bClassCount = MOCK_RESULTS.filter(r => r.ZYYCJGFL === 'B').length;

  // 柱状图数据：模拟近6个月的随访量
  const trendData = [
    { month: "1月", count: 12 },
    { month: "2月", count: 18 },
    { month: "3月", count: 15 },
    { month: "4月", count: 22 },
    { month: "5月", count: pendingTasks + completedTasks }, // 当前月
    { month: "6月", count: 0 },
  ];

  // 饼图数据：异常分类比例
  const categoryData = [
    { name: "A类危急值", value: aClassCount, color: "hsl(var(--destructive))" },
    { name: "B类重要异常", value: bClassCount, color: "hsl(var(--primary))" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">工作台仪表盘</h1>
          <p className="text-muted-foreground mt-1">系统概览与业务实时动态数据统计。</p>
        </div>
        <div className="flex items-center gap-4">
          <FollowUpNotifier />
          <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
            <Link href="/patients">快速档案搜索</Link>
          </Button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">累计档案总数</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">系统内所有患者记录</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-destructive shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待处理随访</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">含 {aClassCount} 例 A 类危急预警</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">任务闭环完成率</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">已完成 {completedTasks} / 总计 {totalTasks}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">本月异常检出</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{MOCK_RESULTS.length}</div>
            <p className="text-xs text-muted-foreground mt-1">较上月同期增长 8.5%</p>
          </CardContent>
        </Card>
      </div>

      {/* 图表展示区 */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              随访业务量趋势 (近半年)
            </CardTitle>
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
                      return (
                        <div className="bg-background border p-2 rounded-lg shadow-sm text-xs">
                          <p className="font-bold">{payload[0].payload.month}</p>
                          <p className="text-primary">随访量: {payload[0].value}</p>
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
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              重要异常结果分类占比
            </CardTitle>
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
                <Tooltip />
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
            <CardDescription>常用功能快捷访问</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-24 flex-col gap-2 border-dashed border-primary/40 hover:bg-primary/5 hover:border-primary" asChild>
              <Link href="/abnormal-results">
                <AlertCircle className="h-6 w-6 text-primary" />
                <span>登记新异常结果</span>
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
            <CardTitle>系统实时日志</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: '管理员', action: '新增了 1 条 A 类危急值登记', time: '2分钟前', type: 'alert' },
                { name: '系统', action: '自动生成了 3 条随访任务', time: '12分钟前', type: 'update' },
                { name: '王医生', action: '完成了张伟的电话随访', time: '45分钟前', type: 'completed' },
                { name: '李护士', action: '上传了 2 份 PDF 检查报告', time: '1小时前', type: 'update' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${item.type === 'alert' ? 'bg-destructive' : item.type === 'completed' ? 'bg-secondary' : 'bg-primary'}`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.action}</p>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-xs text-muted-foreground">查看更多系统日志...</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
