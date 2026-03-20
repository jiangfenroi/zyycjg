
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, User, Lock, Loader2, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DataService } from "@/services/data-service"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [dbLoading, setDbLoading] = React.useState(false)
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [settings, setSettings] = React.useState<any>(null)
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)

  const [dbConfig, setDbConfig] = React.useState({
    host: '',
    port: '10699',
    user: 'medi_admin',
    password: 'AdminPassword123',
    database: 'meditrack_db'
  })

  React.useEffect(() => {
    DataService.getSystemSettings().then(setSettings);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return;

    setLoading(true)
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.login(username, password)
        if (result.success) {
          localStorage.setItem('currentUser', JSON.stringify(result.user))
          router.push('/')
          toast({ title: "登录成功", description: `欢迎回来，${result.user.REAL_NAME}` })
        } else {
          toast({ variant: "destructive", title: "登录失败", description: result.error })
        }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "错误", description: "中心库连接异常" })
    } finally {
      setLoading(false)
    }
  }

  const handleDbSetup = async () => {
    setDbLoading(true)
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.setupDB(dbConfig)
        if (result.success) {
          toast({ title: "成功", description: "数据库已成功连接" })
          setIsSettingsOpen(false)
          DataService.getSystemSettings().then(setSettings)
        } else {
          toast({ variant: "destructive", title: "失败", description: result.error })
        }
      }
    } finally {
      setDbLoading(false)
    }
  }

  const bgStyle = settings?.LOGIN_BG_URL 
    ? { backgroundImage: `url(app-file://${settings.LOGIN_BG_URL})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950" style={bgStyle}>
      {/* 增强型视觉遮罩，解决背景图刺眼问题 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md z-0"></div>
      
      {/* 装饰性光影 */}
      {!settings?.LOGIN_BG_URL && (
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[140px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[140px]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-transparent to-slate-900/50"></div>
        </div>
      )}

      <div className="w-full max-w-md space-y-8 relative z-10 p-6 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 bg-white p-1 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white/20">
            {settings?.SYSTEM_LOGO_URL ? (
              <img src={`app-file://${settings.SYSTEM_LOGO_URL}`} className="w-full h-full object-contain" alt="Logo" />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center rounded-2xl">
                <ShieldCheck className="h-12 w-12 text-white" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-xl">
              {settings?.SYSTEM_NAME || "重要异常结果管理系统"}
            </h1>
            <p className="text-white/60 text-sm font-medium tracking-widest uppercase">全院中心化数据库管理平台</p>
          </div>
        </div>

        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-white/95 backdrop-blur-xl border-none">
          <CardHeader>
            <CardTitle className="text-xl">用户身份验证</CardTitle>
            <CardDescription>请输入您的工号和安全密码进行登录</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">工号</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="username" placeholder="请输入工号" className="pl-10 h-11" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="请输入密码" className="pl-10 h-11" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-6">
              <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "立即进入系统"}
              </Button>
              
              <div className="flex justify-center w-full pt-4 border-t border-slate-100">
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      <Server className="mr-2 h-3.5 w-3.5" /> 数据库连接配置
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>中心库接入配置</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-1">
                        <Label className="text-xs">服务器主机 (Host)</Label>
                        <Input placeholder="172.17.16.x" value={dbConfig.host} onChange={e => setDbConfig({...dbConfig, host: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">端口</Label>
                          <Input placeholder="10699" value={dbConfig.port} onChange={e => setDbConfig({...dbConfig, port: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">数据库名</Label>
                          <Input placeholder="meditrack_db" value={dbConfig.database} onChange={e => setDbConfig({...dbConfig, database: e.target.value})} />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleDbSetup} disabled={dbLoading} className="w-full h-11">
                        {dbLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "保存并测试连接"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center text-white/30 text-[10px] tracking-widest font-mono">
          SYSTEM VERSION 1.2.0-CENTERED / &copy; 2024 重要异常结果管理系统
        </div>
      </div>
    </div>
  )
}
