
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Database, Server, User, Lock, Globe, Loader2, ShieldCheck, Link as LinkIcon } from "lucide-react"
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
      toast({ variant: "destructive", title: "配置不完整", description: "请输入中心服务器 IP 地址。" })
      return
    }

    setLoading(true)
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.setupDB(config)
        if (result.success) {
          toast({ title: "服务器连接成功", description: "客户端已成功接入 MediTrack 中心网络。" })
          setTimeout(() => router.push('/login'), 1500)
        } else {
          toast({ 
            variant: "destructive", 
            title: "连接失败", 
            description: result.error || "无法连接至指定的中心服务器，请检查网络设置或防火墙。" 
          })
        }
      } else {
        toast({ title: "环境提示", description: "当前处于浏览器演示模式，未检测到网络版客户端环境。" })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "系统错误", description: "无法调用客户端配置模块。" })
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">网络版接入向导</h1>
            <p className="text-muted-foreground mt-2">连接至 MediTrack Connect 中心服务器以同步业务数据</p>
          </div>
        </div>

        <Card className="shadow-2xl border-none ring-1 ring-slate-200">
          <CardHeader className="bg-slate-50/50 border-b pb-6">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Server className="h-5 w-5" />
              中心数据库配置
            </CardTitle>
            <CardDescription>
              配置成功后，本客户端将实现与全院数据的实时共享与同步。
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSetup}>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-2">
                  <Label>服务器主机</Label>
                  <Input 
                    placeholder="例如: 192.168.1.100" 
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
                <Label>业务数据库名称</Label>
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
                  <Label>访问账号</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      className="pl-10"
                      placeholder="db_user" 
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
                      placeholder="密码" 
                      value={config.password}
                      onChange={e => setConfig({...config, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pb-8">
              <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "测试并接入中心网络"}
              </Button>
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50/50 p-3 rounded-md w-full border border-blue-100">
                <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5" />
                <span>
                  <b>注意：</b> 请确保您的计算机能够访问服务器 IP 的 3306 端口。如有疑问，请咨询系统管理员。
                </span>
              </div>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-xs text-slate-400 mt-8">
          MediTrack Connect v1.0 网络版客户端
        </p>
      </div>
    </div>
  )
}
