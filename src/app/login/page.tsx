
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, User, Lock, Loader2, Server, AlertCircle, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DataService } from "@/services/data-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [dbLoading, setDbLoading] = React.useState(false)
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [settings, setSettings] = React.useState<any>(null)
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [isElectron, setIsElectron] = React.useState(false)

  // UI 零缓存逻辑：数据库配置状态始终为空，绝不从本地回显已保存的参数
  const [dbConfig, setDbConfig] = React.useState({
    host: '',
    port: '',
    user: '',
    password: '',
    database: ''
  })

  React.useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && !!window.electronAPI)
    DataService.getSystemSettings().then(setSettings)
  }, [])

  // 每次打开弹窗时强制重置输入状态，确保不缓存任何敏感信息
  const handleOpenSettings = (open: boolean) => {
    setIsSettingsOpen(open);
    if (open) {
      setDbConfig({ host: '', port: '', user: '', password: '', database: '' });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      toast({ variant: "destructive", title: "校验失败", description: "请输入工号和密码" })
      return
    }

    setLoading(true)
    try {
      if (isElectron && window.electronAPI) {
        const result = await window.electronAPI.login(username, password)
        if (result.success) {
          localStorage.setItem('currentUser', JSON.stringify(result.user))
          router.push('/')
          toast({ title: "登录成功", description: `欢迎回来，${result.user.REAL_NAME}` })
        } else {
          toast({ variant: "destructive", title: "登录失败", description: result.error })
        }
      } else {
        if (username === 'admin' && password === '123456') {
          const mockUser = { ID: 0, USERNAME: 'admin', REAL_NAME: '演示管理员', ROLE: 'admin' }
          localStorage.setItem('currentUser', JSON.stringify(mockUser))
          router.push('/')
          toast({ title: "预览模式登录", description: "已进入演示环境" })
        } else {
          toast({ variant: "destructive", title: "环境限制", description: "请使用 admin / 123456 或在桌面端运行。" })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDbSetup = async () => {
    if (!isElectron) {
      toast({ variant: "destructive", title: "操作受限", description: "Web 预览模式不支持物理连接" })
      return
    }
    if (!dbConfig.host || !dbConfig.database || !dbConfig.user || !dbConfig.password) {
      toast({ variant: "destructive", title: "校验失败", description: "请完整填写数据库接入参数" })
      return
    }
    setDbLoading(true)
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.setupDB(dbConfig)
        if (result.success) {
          toast({ title: "接入成功", description: "远程数据库已接入" })
          setIsSettingsOpen(false)
          setDbConfig({ host: '', port: '', user: '', password: '', database: '' })
          const newSettings = await DataService.getSystemSettings(true)
          setSettings(newSettings)
        } else {
          toast({ variant: "destructive", title: "接入失败", description: result.error })
        }
      }
    } finally {
      setDbLoading(false)
    }
  }

  const bgStyle = settings?.LOGIN_BG_URL 
    ? { backgroundImage: `url(app-file://${settings.LOGIN_BG_URL})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: 'hsl(var(--background))' };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background" style={bgStyle}>
      <div className="absolute inset-0 bg-background/20 backdrop-blur-md z-0"></div>
      
      <div className="w-full max-w-md space-y-8 relative z-10 p-6 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-card p-1 rounded-2xl shadow-xl flex items-center justify-center border">
            {settings?.SYSTEM_LOGO_URL ? (
              <img src={`app-file://${settings.SYSTEM_LOGO_URL}`} className="w-full h-full object-contain" alt="Logo" />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center rounded-xl">
                <ShieldCheck className="h-10 w-10 text-primary-foreground" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground drop-shadow-sm">
              {settings?.SYSTEM_NAME || "重要异常结果管理系统"}
            </h1>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">全院中心化数据库管理平台</p>
          </div>
        </div>

        {!isElectron && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-[10px]">预览环境：演示工号 admin / 密码 123456</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-2xl bg-card/90 backdrop-blur-xl border-none">
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
                  <Input id="username" placeholder="请输入工号" className="pl-10 h-11" value={username} onChange={e => setUsername(e.target.value)} disabled={loading} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="请输入密码" className="pl-10 h-11" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full h-11 text-sm font-bold shadow-lg" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "进入系统"}
              </Button>
              
              <div className="flex items-center justify-center w-full pt-4 border-t">
                <Dialog open={isSettingsOpen} onOpenChange={handleOpenSettings}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-[10px] text-muted-foreground">
                      <Server className="mr-1 h-3 w-3" /> 数据库接入配置
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                      <DialogTitle>中心服务器接入</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-1">
                        <Label className="text-xs">服务器主机</Label>
                        <div className="relative">
                           <Server className="absolute left-3 top-3 h-3 w-3 text-muted-foreground" />
                           <Input placeholder="例如：127.0.0.1" className="pl-8 text-xs h-9" value={dbConfig.host} onChange={e => setDbConfig({...dbConfig, host: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">数据库名</Label>
                          <Input placeholder="例如：meditrack_db" className="text-xs h-9" value={dbConfig.database} onChange={e => setDbConfig({...dbConfig, database: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">端口</Label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-3 h-3 w-3 text-muted-foreground" />
                            <Input placeholder="例如：10699" className="pl-8 text-xs h-9" value={dbConfig.port} onChange={e => setDbConfig({...dbConfig, port: e.target.value})} />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">访问账号</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-3 w-3 text-muted-foreground" />
                            <Input placeholder="例如：root" className="pl-8 text-xs h-9" value={dbConfig.user} onChange={e => setDbConfig({...dbConfig, user: e.target.value})} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">访问密码</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-3 w-3 text-muted-foreground" />
                            <Input type="password" placeholder="请输入密码" className="pl-8 text-xs h-9" value={dbConfig.password} onChange={e => setDbConfig({...dbConfig, password: e.target.value})} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleDbSetup} disabled={dbLoading || !isElectron} className="w-full h-10 text-xs font-bold">
                        {dbLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "确认接入"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center text-muted-foreground/40 text-[10px] tracking-widest font-mono">
          &copy; 2024 重要异常结果管理系统
        </div>
      </div>
    </div>
  )
}
