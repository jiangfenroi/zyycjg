
"use client"

import * as React from 'react'
import { 
  Palette, 
  Save, 
  Loader2, 
  Image as ImageIcon, 
  Layout, 
  FolderOpen, 
  UserCog, 
  UserPlus, 
  Trash2, 
  Upload,
  BookOpen,
  Globe,
  Monitor
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { DataService } from '@/services/data-service'
import { SystemSettings, User } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function GlobalManagementPage() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [settings, setSettings] = React.useState<SystemSettings>({
    SYSTEM_NAME: '',
    SYSTEM_LOGO_TEXT: '',
    SYSTEM_LOGO_URL: '',
    LOGIN_BG_URL: '',
    STORAGE_PATH: '',
    PACS_URL_TEMPLATE: '',
  })
  const [users, setUsers] = React.useState<User[]>([])
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false)
  
  const [newUser, setNewUser] = React.useState({ USERNAME: '', PASSWORD: '', REAL_NAME: '', ROLE: 'operator' })

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [s, u] = await Promise.all([
        DataService.getSystemSettings(), 
        DataService.getUsers()
      ])
      setSettings(s)
      setUsers(u)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const handleSaveBasic = async () => {
    setSubmitting(true)
    const success = await DataService.updateSystemSettings({ 
      SYSTEM_NAME: settings.SYSTEM_NAME, 
      SYSTEM_LOGO_TEXT: settings.SYSTEM_LOGO_TEXT,
      STORAGE_PATH: settings.STORAGE_PATH,
      PACS_URL_TEMPLATE: settings.PACS_URL_TEMPLATE
    })
    if (success) toast({ title: "配置已保存" })
    setSubmitting(false)
  }

  const handleUploadAsset = async (type: 'SYSTEM_LOGO_URL' | 'LOGIN_BG_URL') => {
    const files = await DataService.selectLocalFiles(false);
    if (files.length > 0) {
      setSubmitting(true)
      try {
        const success = await DataService.uploadSystemAsset(files[0].path, type);
        if (success) {
          toast({ title: "资产已同步至中心库" });
          loadData();
        }
      } catch (e: any) {
        toast({ variant: "destructive", title: "物理同步失败", description: e.message });
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleAddUser = async () => {
    setSubmitting(true)
    const res = await DataService.addUser(newUser)
    if (res.success) {
      toast({ title: "用户已同步" }); 
      setIsAddUserOpen(false); 
      loadData();
      setNewUser({ USERNAME: '', PASSWORD: '', REAL_NAME: '', ROLE: 'operator' });
    }
    setSubmitting(false)
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary">全院管理中心</h1>
        <p className="text-muted-foreground text-sm">品牌资产、临床集成与中心化存储配置</p>
      </div>

      <Tabs defaultValue="brand">
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="brand">视觉与品牌</TabsTrigger>
          <TabsTrigger value="clinical">临床集成</TabsTrigger>
          <TabsTrigger value="storage">中心存储</TabsTrigger>
          <TabsTrigger value="users">人员权限</TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="space-y-6 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" /> 品牌文字</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>系统显示名称</Label>
                  <Input value={settings.SYSTEM_NAME} onChange={e => setSettings({...settings, SYSTEM_NAME: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>默认 Logo 占位文字</Label>
                  <Input value={settings.SYSTEM_LOGO_TEXT} maxLength={1} onChange={e => setSettings({...settings, SYSTEM_LOGO_TEXT: e.target.value})} />
                </div>
                <Button className="w-full" onClick={handleSaveBasic} disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  保存基本信息
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="h-4 w-4" /> 图形资产同步</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs">系统 Logo 图片</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded border overflow-hidden flex items-center justify-center">
                      {settings.SYSTEM_LOGO_URL ? <img src={`app-file://${settings.SYSTEM_LOGO_URL}`} className="w-full h-full object-contain" /> : <ImageIcon className="h-5 w-5 opacity-20" />}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleUploadAsset('SYSTEM_LOGO_URL')} disabled={submitting}>
                      <Upload className="h-3.5 w-3.5 mr-2" /> 同步 Logo
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs">登录页全屏背景</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-12 bg-muted rounded border overflow-hidden flex items-center justify-center">
                      {settings.LOGIN_BG_URL ? <img src={`app-file://${settings.LOGIN_BG_URL}`} className="w-full h-full object-cover" /> : <Layout className="h-5 w-5 opacity-20" />}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleUploadAsset('LOGIN_BG_URL')} disabled={submitting}>
                      <Upload className="h-3.5 w-3.5 mr-2" /> 同步背景
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clinical" className="pt-4">
           <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Monitor className="h-4 w-4" /> 外部浏览器集成</CardTitle>
                <CardDescription>配置通过外部默认浏览器调阅临床系统（如 PACS）的跳转规则。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>PACS 影像浏览器跳转地址模板</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="http://172.16.201.61:7242/?ChtId=${id}" 
                      className="pl-10"
                      value={settings.PACS_URL_TEMPLATE} 
                      onChange={e => setSettings({...settings, PACS_URL_TEMPLATE: e.target.value})} 
                    />
                  </div>
                  <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-primary mt-0.5" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      系统会自动将 <code>{"${id}"}</code> 替换为实际的患者 ID。<br />
                      示例：<code>http://PACS_SERVER/view?id={"${id}"}</code><br />
                      配置后，所有终端均会同步此调阅地址。
                    </p>
                  </div>
                </div>
                <Button onClick={handleSaveBasic} disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  确认同步临床集成配置
                </Button>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="storage" className="pt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FolderOpen className="h-4 w-4" /> 物理存储映射</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>全院统一物理存储 UNC 路径</Label>
                <Input placeholder="\\172.17.16.18\MediStorage" value={settings.STORAGE_PATH} onChange={e => setSettings({...settings, STORAGE_PATH: e.target.value})} />
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-[10px] text-blue-700 leading-relaxed">
                    配置后，系统会自动在目录下创建 <code>system_assets</code> 文件夹存储全局资源。<br />
                    患者报告将按 <code>[患者ID]/[报告类别]</code> 自动分拣。请确保运行账户具有完全的读写权限。
                  </p>
                </div>
              </div>
              <Button onClick={handleSaveBasic} disabled={submitting}>确认全院同步设置</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">全院账号库</CardTitle>
                <CardDescription className="text-xs">仅主管理员可管理操作员凭据</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAddUserOpen(true)}><UserCog className="h-4 w-4 mr-2" /> 新增账户</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead>工号</TableHead><TableHead>真实姓名</TableHead><TableHead>角色</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.ID} className="text-xs">
                      <TableCell className="font-mono">{u.USERNAME}</TableCell>
                      <TableCell className="font-medium">{u.REAL_NAME}</TableCell>
                      <TableCell><Badge variant={u.ROLE === 'admin' ? 'default' : 'outline'}>{u.ROLE === 'admin' ? '管理员' : '操作员'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if(confirm('注销此人？')) DataService.deleteUser(u.ID, u.USERNAME).then(() => loadData()) }} disabled={u.USERNAME === 'admin'}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 新增用户弹窗 */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新增系统账户</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="space-y-2"><Label>登录工号</Label><Input placeholder="username" value={newUser.USERNAME} onChange={e => setNewUser({...newUser, USERNAME: e.target.value})} /></div>
            <div className="space-y-2"><Label>初始密码</Label><Input type="password" value={newUser.PASSWORD} onChange={e => setNewUser({...newUser, PASSWORD: e.target.value})} /></div>
            <div className="space-y-2"><Label>真实姓名</Label><Input placeholder="张三" value={newUser.REAL_NAME} onChange={e => setNewUser({...newUser, REAL_NAME: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>系统权限角色</Label>
              <Select value={newUser.ROLE} onValueChange={v => setNewUser({...newUser, ROLE: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="operator">临床操作员</SelectItem><SelectItem value="admin">系统管理员</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddUser} disabled={submitting}>确认同步账号库</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
