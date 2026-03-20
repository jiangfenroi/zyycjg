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
import { ThemeToggle } from "@/components/theme-toggle"

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
    : { backgroundColor: '#f8fafc' };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50" style={bgStyle}>
      {/* 玻璃拟态遮罩 - 恢复为轻量感 */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-0"></div>
      
      <div className="w-full max-w-md space-y-8 relative z-10 p-6 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-white p-1 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
            {settings?.SYSTEM_LOGO_URL ? (
              <img src={`app-file://${settings.SYSTEM_LOGO_URL}`} className="w-full h-full object-contain" alt="Logo" />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center rounded-xl">
                <ShieldCheck className="h-10 w-10 text-white" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 drop-shadow-sm">
              {settings?.SYSTEM_NAME || "重要异常结果管理系统"}
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">医疗中心化数据库管理平台</p>
          </div>
        </div>

        <Card className="shadow-2xl bg-white/95 backdrop-blur-xl border-none">
          <CardHeader>
            <CardTitle className="text-xl">用户登录</CardTitle>
            <CardDescription>请输入工号和安全密码</CardDescription>
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
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full h-11 text-sm font-bold shadow-lg" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "立即登录系统"}
              </Button>
              
              <div className="flex items-center justify-between w-full pt-4 border-t">
                <ThemeToggle />
                
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-[10px] text-muted-foreground">
                      <Server className="mr-1 h-3 w-3" /> 数据库配置
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>数据库接入配置</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-1">
                        <Label className="text-xs">服务器地址</Label>
                        <Input placeholder="127.0.0.1" value={dbConfig.host} onChange={e => setDbConfig({...dbConfig, host: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">端口</Label>
                          <Input value={dbConfig.port} onChange={e => setDbConfig({...dbConfig, port: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">数据库名</Label>
                          <Input value={dbConfig.database} onChange={e => setDbConfig({...dbConfig, database: e.target.value})} />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleDbSetup} disabled={dbLoading} className="w-full">
                        {dbLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "保存并连接"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center text-slate-400 text-[10px] tracking-widest font-mono">
          &copy; 2024 重要异常结果管理系统
        </div>
      </div>
    </div>
  )
}
