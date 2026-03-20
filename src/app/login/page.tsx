
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, User, Lock, Loader2, Server, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DataService } from "@/services/data-service"

/**
 * 登录页面：物理响应加固
 * 1. 物理移除表单嵌套冲突，确保“数据库配置”不会触发“登录提交”。
 * 2. 强制指定 type="button"，防止 Electron 环境下的默认刷新。
 */
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

  const [dbConfig, setDbConfig] = React.useState({
    host: '',
    port: '10699',
    user: 'medi_admin',
    password: '',
    database: 'meditrack_db'
  })

  React.useEffect(() => {
    const checkElectron = typeof window !== 'undefined' && !!window.electronAPI;
    setIsElectron(checkElectron)
    
    // 异步加载品牌资产
    DataService.getSystemSettings().then(setSettings).catch(() => {});
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password || loading) {
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
          if (result.error === 'NO_CONFIG') {
            toast({ variant: "destructive", title: "未接入服务器", description: "请先配置中心服务器接入参数" })
            setIsSettingsOpen(true)
          } else {
            toast({ variant: "destructive", title: "登录失败", description: result.error })
          }
        }
      } else {
        // Web 预览演示模式
        if (username === 'admin' && password === '123456') {
          const mockUser = { ID: 0, USERNAME: 'admin', REAL_NAME: '演示管理员', ROLE: 'admin' }
          localStorage.setItem('currentUser', JSON.stringify(mockUser))
          router.push('/')
        } else {
          toast({ variant: "destructive", title: "环境限制", description: "请在桌面端运行或使用 admin/123456" })
        }
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "系统错误", description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDbSetup = async (e: React.MouseEvent) => {
    e.preventDefault(); // 物理防止冒泡
    if (!isElectron) return;
    if (!dbConfig.host || !dbConfig.database || dbLoading) {
      toast({ variant: "destructive", title: "校验失败", description: "地址与数据库名为必填项" });
      return;
    }
    
    setDbLoading(true)
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.setupDB(dbConfig)
        if (result.success) {
          toast({ title: "接入成功", description: "中心服务器连接已物理同步" })
          setIsSettingsOpen(false)
          // 重新载入品牌设置
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
      
      <div className="w-full max-w-md space-y-8 relative z-10 p-6 animate-in fade-in duration-300">
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
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">中心化数据库管理平台</p>
          </div>
        </div>

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
            </CardFooter>
          </form>

          {/* 物理隔离：将 Dialog 移出主表单，彻底防止事件冲突 */}
          <div className="flex items-center justify-center w-full pb-6 px-6">
            <div className="w-full pt-4 border-t text-center">
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="text-[10px] text-muted-foreground">
                    <Server className="mr-1 h-3 w-3" /> 数据库接入配置
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px]">
                  <DialogHeader>
                    <DialogTitle>中心服务器接入</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-1">
                      <Label className="text-xs">服务器地址</Label>
                      <Input placeholder="127.0.0.1" className="text-xs h-9" value={dbConfig.host} onChange={e => setDbConfig({...dbConfig, host: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">数据库名</Label>
                        <Input placeholder="meditrack_db" className="text-xs h-9" value={dbConfig.database} onChange={e => setDbConfig({...dbConfig, database: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">端口</Label>
                        <Input placeholder="10699" className="text-xs h-9" value={dbConfig.port} onChange={e => setDbConfig({...dbConfig, port: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">账号</Label>
                        <Input placeholder="medi_admin" className="text-xs h-9" value={dbConfig.user} onChange={e => setDbConfig({...dbConfig, user: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">密码</Label>
                        <Input type="password" placeholder="******" className="text-xs h-9" value={dbConfig.password} onChange={e => setDbConfig({...dbConfig, password: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" onClick={handleDbSetup} disabled={dbLoading || !isElectron} className="w-full h-10 text-xs font-bold">
                      {dbLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "确认接入中心服务器"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
