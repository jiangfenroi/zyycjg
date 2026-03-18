import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, History, Users, FileText, TrendingUp, CheckCircle2, Clock } from "lucide-react"
import { FollowUpNotifier } from "@/components/follow-up-notifier"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MOCK_PERSONS, MOCK_TASKS, MOCK_RESULTS } from "@/lib/mock-store"

export default function Dashboard() {
  const totalPatients = MOCK_PERSONS.length;
  const pendingTasks = MOCK_TASKS.filter(t => t.STATUS === 'pending').length;
  const completedTasks = MOCK_TASKS.filter(t => t.STATUS === 'completed').length;
  const completionRate = MOCK_TASKS.length > 0 ? Math.round((completedTasks / MOCK_TASKS.length) * 100) : 0;
  const aClassCount = MOCK_RESULTS.filter(r => r.ZYYCJGFL === 'A').length;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">工作台仪表盘</h1>
          <p className="text-muted-foreground mt-1">欢迎回来，这是今日体检随访系统的概览数据。</p>
        </div>
        <div className="flex items-center gap-4">
          <FollowUpNotifier />
          <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
            <Link href="/patients">快速搜索</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">累计档案</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">系统内所有 SP_PERSON 记录</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待随访任务</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">含 {aClassCount} 例 A 类危急值</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">本月完成率</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">基于当前任务库计算</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">影像查询活跃</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground mt-1">今日 PACS 系统联调调用</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>业务快捷入口</CardTitle>
            <CardDescription>根据您的日常操作习惯，推荐以下核心功能</CardDescription>
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
                <span>执行今日随访</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-dashed border-muted-foreground/40" asChild>
              <Link href="/reports">
                <FileText className="h-6 w-6" />
                <span>管理检查报告</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 border-dashed border-muted-foreground/40" asChild>
              <Link href="/patients">
                <Users className="h-6 w-6" />
                <span>查询患者病历</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>近期操作动态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: '管理员', action: '新增重要异常登记', time: '5分钟前', type: 'alert' },
                { name: '王医生', action: '查看了张伟的影像', time: '18分钟前', type: 'update' },
                { name: '系统', action: '生成待随访任务', time: '1小时前', type: 'completed' },
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
            <Button variant="ghost" className="w-full mt-6 text-xs text-muted-foreground">更多日志数据...</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
