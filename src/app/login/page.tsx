"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, User, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")

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
          // 存储用户信息并跳转
          localStorage.setItem('currentUser', JSON.stringify(result.user))
          router.push('/')
          toast({ title: "登录成功", description: `欢迎回来，${result.user.REAL_NAME}` })
        } else {
          toast({ variant: "destructive", title: "登录失败", description: result.error || "账号或密码错误" })
        }
      } else {
        // Mock 环境登录逻辑
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
            <ShieldCheck className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">MediTrack Connect</h1>
          <p className="text-muted-foreground">体检异常结果闭环管理系统</p>
        </div>

        <Card className="border-t-4 border-t-primary shadow-2xl">
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
            <CardFooter>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "立即登录"}
              </Button>
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
