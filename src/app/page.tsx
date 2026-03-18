import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, History, Users, FileText, TrendingUp, CheckCircle2, Clock } from "lucide-react"
import { FollowUpNotifier } from "@/components/follow-up-notifier"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">MediTrack Connect</h1>
          <p className="text-muted-foreground mt-1">欢迎回来，体检中心重要异常结果随访系统。</p>
        </div>
        <div className="flex items-center gap-4">
          <FollowUpNotifier />
          <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
            <Link href="/patients">搜索患者</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总登记病例</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground mt-1">+12% 较上月</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待随访异常</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground mt-1">需要立即处理</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">已完成随访</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground mt-1">本季度完成率</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">PACS查看次数</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground mt-1">今日活跃查询</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>常用的系统功能快捷入口</CardDescription>
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
                <span>开始今日随访</span>
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
                <span>批量导入数据</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>近期通知动态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: '张伟', action: '完成随访通知', time: '10分钟前', type: 'completed' },
                { name: '李丽', action: '上传了MRI报告', time: '45分钟前', type: 'update' },
                { name: '王强', action: '重要异常A类登记', time: '2小时前', type: 'alert' },
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
            <Button variant="ghost" className="w-full mt-6 text-xs text-muted-foreground">查看所有动态</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
