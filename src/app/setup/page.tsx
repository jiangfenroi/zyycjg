
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Database, Server, User, Lock, Globe, Loader2, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function SetupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  
  const [config, setConfig] = React.useState({
    host: '',
    port: '3306',
    user: 'root',
    password: '',
    database: 'meditrack_db'
  })

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config.host) {
      toast({ variant: "destructive", title: "配置不完整", description: "请输入中心服务器地址" })
      return
    }

    setLoading(true)
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.setupDB(config)
        if (result.success) {
          toast({ title: "网络接入成功", description: "中心数据库已同步，正在进入登录页面" })
          setTimeout(() => router.push('/login'), 1500)
        } else {
          toast({ 
            variant: "destructive", 
            title: "连接失败", 
            description: result.error || "无法连接中心服务器，请检查网络或参数" 
          })
        }
      } else {
        toast({ title: "浏览器演示环境", description: "该环境不支持物理数据库连接" })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "系统错误", description: "网络配置模块加载异常" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <LinkIcon className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">中心服务器接入</h1>
            <p className="text-muted-foreground mt-2">首次运行需连接医疗数据中心以建立同步</p>
          </div>
        </div>

        <Card className="shadow-2xl border-none ring-1 ring-slate-200">
          <CardHeader className="bg-slate-50/50 border-b pb-6">
            <CardTitle className="flex items-center gap-2 text-primary text-lg">
              <Server className="h-5 w-5" />
              数据库接入参数
            </CardTitle>
            <CardDescription>
              配置成功后，应用将自动完成中心端业务表的检测与初始化
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSetup}>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-2">
                  <Label>服务器主机</Label>
                  <Input 
                    placeholder="例如 192.168.1.100" 
                    value={config.host}
                    onChange={e => setConfig({...config, host: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>端口</Label>
                  <Input 
                    placeholder="3306" 
                    value={config.port}
                    onChange={e => setConfig({...config, port: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>数据库名称</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-10"
                    placeholder="默认为 meditrack_db" 
                    value={config.database}
                    onChange={e => setConfig({...config, database: e.target.value})}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic px-1">若填写的库名在服务器上不存在，系统将尝试自动创建</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>访问账号</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      className="pl-10"
                      placeholder="root" 
                      value={config.user}
                      onChange={e => setConfig({...config, user: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>访问密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="password"
                      className="pl-10"
                      placeholder="数据库密码" 
                      value={config.password}
                      onChange={e => setConfig({...config, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pb-8">
              <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "建立连接并初始化中心端"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
