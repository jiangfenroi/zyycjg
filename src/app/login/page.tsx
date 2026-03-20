
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, User, Lock, Loader2, Server, Database, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DataService } from "@/services/data-service"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [dbLoading, setDbLoading] = React.useState(false)
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)

  const [dbConfig, setDbConfig] = React.useState({
    host: '',
    port: '10699',
    user: 'medi_admin',
    password: 'AdminPassword123',
    database: 'meditrack_db'
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      toast({ variant: "destructive", title: "登录失败", description: "请输入用户名和密码" })
      return
    }

    setLoading(true)
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.login(username, password)
        if (result.success) {
          localStorage.setItem('currentUser', JSON.stringify(result.user))
          router.push('/')
          toast({ title: "登录成功", description: `欢迎回来，${result.user.REAL_NAME}` })
        } else {
          toast({ variant: "destructive", title: "登录失败", description: result.error || "账号或密码错误" })
        }
      } else {
        if (username === 'admin' && password === '123456') {
          localStorage.setItem('currentUser', JSON.stringify({ USERNAME: 'admin', REAL_NAME: '系统管理员', ROLE: 'admin' }))
          router.push('/')
        } else {
          toast({ variant: "destructive", title: "登录失败", description: "Mock环境下仅支持admin登录" })
        }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "系统错误", description: "无法连接到认证服务" })
    } finally {
      setLoading(false)
    }
  }

  const handleDbSetup = async () => {
    if (!dbConfig.host || !dbConfig.database) {
      toast({ variant: "destructive", title: "配置不完整", description: "请输入服务器地址和数据库名称" })
      return
    }

    setDbLoading(true)
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.setupDB(dbConfig)
        if (result.success) {
          toast({ title: "数据库连接成功", description: "中心端已同步，现在可以尝试登录。" })
          setIsSettingsOpen(false)
        } else {
          toast({ variant: "destructive", title: "连接失败", description: result.error || "请检查网络或参数" })
        }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "配置异常", description: "无法保存数据库设置" })
    } finally {
      setDbLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
            <ShieldCheck className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">MediTrack Connect</h1>
          <p className="text-muted-foreground">体检异常结果闭环管理系统</p>
        </div>

        <Card className="border-t-4 border-t-primary shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>用户登录</CardTitle>
            <CardDescription>请输入您的工号和密码以访问系统</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">账号 / 工号</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="username" 
                    placeholder="请输入用户名" 
                    className="pl-10" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">登录密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="请输入密码" 
                    className="pl-10" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "立即登录"}
              </Button>
              
              <div className="flex justify-center w-full pt-2 border-t border-dashed">
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
                      <Server className="mr-1.5 h-3.5 w-3.5" /> 服务器连接设置
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        中心数据库连接配置
                      </DialogTitle>
                      <DialogDescription>
                        首次运行或服务器变更时，请在此配置 MySQL 接入参数。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3 space-y-2">
                          <Label>服务器地址</Label>
                          <Input 
                            placeholder="127.0.0.1" 
                            value={dbConfig.host}
                            onChange={e => setDbConfig({...dbConfig, host: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>端口</Label>
                          <Input 
                            placeholder="10699" 
                            value={dbConfig.port}
                            onChange={e => setDbConfig({...dbConfig, port: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>数据库名称</Label>
                        <Input 
                          placeholder="meditrack_db" 
                          value={dbConfig.database}
                          onChange={e => setDbConfig({...dbConfig, database: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>账号</Label>
                          <Input 
                            value={dbConfig.user}
                            onChange={e => setDbConfig({...dbConfig, user: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>密码</Label>
                          <Input 
                            type="password"
                            value={dbConfig.password}
                            onChange={e => setDbConfig({...dbConfig, password: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleDbSetup} disabled={dbLoading} className="w-full">
                        {dbLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                        连接并保存配置
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground">
          &copy; 2024 MediTrack Connect. 医疗数据安全保护系统.
        </p>
      </div>
    </div>
  )
}
