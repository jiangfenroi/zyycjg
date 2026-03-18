"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Database, Server, User, Lock, Globe, Loader2, ShieldCheck } from "lucide-react"
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
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: 'meditrack_db'
  })

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.setupDB(config)
        if (result.success) {
          toast({ title: "数据库连接成功", description: "配置已保存，正在跳转至登录界面..." })
          setTimeout(() => router.push('/login'), 1500)
        } else {
          toast({ 
            variant: "destructive", 
            title: "连接失败", 
            description: result.error || "请检查数据库服务是否启动或参数是否正确。" 
          })
        }
      } else {
        toast({ title: "模拟模式", description: "浏览器环境仅支持 Mock 数据演示。" })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "系统错误", description: "无法调用主进程配置接口。" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Database className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">服务器部署向导</h1>
            <p className="text-muted-foreground">请填写 MySQL 数据库连接信息以完成系统初始化</p>
          </div>
        </div>

        <Card className="shadow-xl border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              数据库环境配置
            </CardTitle>
            <CardDescription>
              配置成功后，系统将自动创建业务表并初始化管理员账号。
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSetup}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-2">
                  <Label>服务器主机 (Host)</Label>
                  <Input 
                    placeholder="localhost 或 IP 地址" 
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
                <Label>数据库名称 (Schema)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-10"
                    placeholder="meditrack_db" 
                    value={config.database}
                    onChange={e => setConfig({...config, database: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>用户名 (User)</Label>
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
                  <Label>密码 (Password)</Label>
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
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "测试连接并保存配置"}
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded w-full">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>首次配置成功后，默认管理员账号为 admin，密码为 123456</span>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
