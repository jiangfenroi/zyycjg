
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
      toast({ variant: "destructive", title: "错误", description: "连接异常" })
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
          toast({ title: "成功", description: "数据库已连接" })
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
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden" style={bgStyle}>
      {!settings?.LOGIN_BG_URL && (
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary rounded-full blur-[120px]"></div>
        </div>
      )}
      
      {settings?.LOGIN_BG_URL && <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>}

      <div className="w-full max-w-md space-y-8 relative z-10 p-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden">
            {settings?.SYSTEM_LOGO_URL ? (
              <img src={`app-file://${settings.SYSTEM_LOGO_URL}`} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <ShieldCheck className="h-12 w-12 text-primary-foreground" />
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
            {settings?.SYSTEM_NAME || "重要异常结果管理系统"}
          </h1>
        </div>

        <Card className="shadow-2xl bg-card/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle>用户登录</CardTitle>
            <CardDescription>请输入工号和密码进入中心系统</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">工号</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="username" placeholder="请输入工号" className="pl-10" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="请输入密码" className="pl-10" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "进入系统"}
              </Button>
              
              <div className="flex justify-center w-full pt-2 border-t border-dashed">
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
                      <Server className="mr-1.5 h-3.5 w-3.5" /> 数据库连接配置
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>中心库配置</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Input placeholder="IP 地址" value={dbConfig.host} onChange={e => setDbConfig({...dbConfig, host: e.target.value})} />
                      <Input placeholder="端口" value={dbConfig.port} onChange={e => setDbConfig({...dbConfig, port: e.target.value})} />
                      <Input placeholder="数据库名" value={dbConfig.database} onChange={e => setDbConfig({...dbConfig, database: e.target.value})} />
                    </div>
                    <DialogFooter>
                      <Button onClick={handleDbSetup} disabled={dbLoading} className="w-full">保存配置</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
