
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
import { SystemSettings, User as SystemUser } from '@/lib/types'
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
  const [users, setUsers] = React.useState<SystemUser[]>([])
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false)
  
  const [newUser, setNewUser] = React.useState({ USERNAME: '', PASSWORD: '', REAL_NAME: '', ROLE: 'operator' as 'admin' | 'operator' })

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [s, u] = await Promise.all([
        DataService.getSystemSettings(true), 
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
    if (submitting) return
    setSubmitting(true)
    try {
      const success = await DataService.updateSystemSettings({ 
        SYSTEM_NAME: settings.SYSTEM_NAME, 
        SYSTEM_LOGO_TEXT: settings.SYSTEM_LOGO_TEXT,
        STORAGE_PATH: settings.STORAGE_PATH,
        PACS_URL_TEMPLATE: settings.PACS_URL_TEMPLATE
      })
      if (success) toast({ title: "配置已全院同步" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadAsset = async (type: 'SYSTEM_LOGO_URL' | 'LOGIN_BG_URL') => {
    const files = await DataService.selectLocalFiles(false);
    if (files.length > 0) {
      setSubmitting(true)
      try {
        const success = await DataService.uploadSystemAsset(files[0].path, type);
        if (success) {
          toast({ title: "视觉资产已归档" });
          loadData();
        }
      } catch (e: any) {
        toast({ variant: "destructive", title: "资产同步失败", description: e.message });
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleAddUser = async () => {
    if (!newUser.USERNAME || submitting) return
    setSubmitting(true)
    try {
      const res = await DataService.addUser(newUser)
      if (res.success) {
        toast({ title: "人员账号已生效" }); 
        setIsAddUserOpen(false); 
        loadData();
        setNewUser({ USERNAME: '', PASSWORD: '', REAL_NAME: '', ROLE: 'operator' });
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="h-[80vh] w-full flex items-center justify-center">
      <Loader2 className="animate-spin h-8 w-8 text-primary opacity-50" />
    </div>
  )

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary">全院管理中心</h1>
        <p className="text-muted-foreground text-sm">中心化临床集成与品牌资产配置引擎</p>
      </div>

      <Tabs defaultValue="brand">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="brand">品牌与视觉</TabsTrigger>
          <TabsTrigger value="clinical">临床跳转集成</TabsTrigger>
          <TabsTrigger value="storage">中心存储映射</TabsTrigger>
          <TabsTrigger value="users">人员权限中心</TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="space-y-6 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4 text-primary" /> 文字品牌</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>系统名称</Label>
                  <Input value={settings.SYSTEM_NAME} onChange={e => setSettings({...settings, SYSTEM_NAME: e.target.value})} placeholder="例如：重要异常结果管理系统" />
                </div>
                <div className="space-y-2">
                  <Label>默认 Logo 字符</Label>
                  <Input value={settings.SYSTEM_LOGO_TEXT} maxLength={1} onChange={e => setSettings({...settings, SYSTEM_LOGO_TEXT: e.target.value})} />
                </div>
                <Button className="w-full font-bold" onClick={handleSaveBasic} disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  保存全院基础配置
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /> 图形资产同步</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold">系统标志 (Logo)</Label>
                  <div className="flex items-center gap-4 p-2 border rounded-lg bg-muted/5">
                    <div className="w-12 h-12 bg-white rounded border flex items-center justify-center shadow-inner overflow-hidden">
                      {settings.SYSTEM_LOGO_URL ? <img src={`app-file://${settings.SYSTEM_LOGO_URL}`} className="w-full h-full object-contain" alt="Logo" /> : <ImageIcon className="h-5 w-5 opacity-20" />}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleUploadAsset('SYSTEM_LOGO_URL')} disabled={submitting}>
                      <Upload className="h-3.5 w-3.5 mr-2" /> 浏览并同步
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold">登录背景图</Label>
                  <div className="flex items-center gap-4 p-2 border rounded-lg bg-muted/5">
                    <div className="w-24 h-12 bg-white rounded border flex items-center justify-center shadow-inner overflow-hidden">
                      {settings.LOGIN_BG_URL ? <img src={`app-file://${settings.LOGIN_BG_URL}`} className="w-full h-full object-cover" alt="BG" /> : <Layout className="h-5 w-5 opacity-20" />}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleUploadAsset('LOGIN_BG_URL')} disabled={submitting}>
                      <Upload className="h-3.5 w-3.5 mr-2" /> 浏览并同步
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clinical" className="pt-4">
           <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Monitor className="h-4 w-4 text-primary" /> PACS 调阅集成</CardTitle>
                <CardDescription>配置通过外部浏览器直接唤醒 PACS 系统查看影像的规则。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>影像调阅 URL 模板</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="http://172.16.201.61:7242/?ChtId=${id}" 
                      className="pl-10 font-mono text-xs"
                      value={settings.PACS_URL_TEMPLATE} 
                      onChange={e => setSettings({...settings, PACS_URL_TEMPLATE: e.target.value})} 
                    />
                  </div>
                  <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg flex items-start gap-3 mt-4">
                    <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      系统在调阅时会自动将 <code>{"${id}"}</code> 占位符替换为当前选中的患者 ID。<br />
                      <div className="mt-2 text-foreground font-bold">配置示例：</div>
                      <code>http://PACS_SERVER/view?id={"${id}"}</code><br />
                      完成配置后，临床人员在档案详情页点击“PACS 影像查询”将自动开启物理调阅。
                    </div>
                  </div>
                </div>
                <Button onClick={handleSaveBasic} disabled={submitting} className="font-bold">
                  {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  保存临床集成配置
                </Button>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="storage" className="pt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FolderOpen className="h-4 w-4 text-primary" /> 全院中心存储</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>统一物理 UNC 路径</Label>
                <Input placeholder="\\172.17.16.18\HospitalData" value={settings.STORAGE_PATH} onChange={e => setSettings({...settings, STORAGE_PATH: e.target.value})} />
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-[10px] text-blue-700 leading-relaxed">
                    所有电子报告将按 <code>[患者ID]/[报告类别]</code> 规则在此目录下分拣归档。请确保运行账户具有中心服务器对应共享文件夹的写权限。
                  </p>
                </div>
              </div>
              <Button onClick={handleSaveBasic} disabled={submitting} className="font-bold">确认物理映射配置</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="pt-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">全院账号权限中心</CardTitle>
                <CardDescription className="text-xs">物理同步至中心库的用户访问凭据管理</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAddUserOpen(true)} className="font-bold"><UserPlus className="h-4 w-4 mr-2" /> 新增人员</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead className="text-xs">工号</TableHead><TableHead className="text-xs">真实姓名</TableHead><TableHead className="text-xs">角色权限</TableHead><TableHead className="text-right text-xs">安全操作</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.ID} className="text-xs">
                      <TableCell className="font-mono text-muted-foreground">{u.USERNAME}</TableCell>
                      <TableCell className="font-bold">{u.REAL_NAME}</TableCell>
                      <TableCell><Badge variant={u.ROLE === 'admin' ? 'default' : 'outline'} className="text-[9px]">{u.ROLE === 'admin' ? '管理员' : '临床操作员'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if(confirm('确定注销此人员吗？')) DataService.deleteUser(u.ID, u.USERNAME).then(() => loadData()) }} disabled={u.USERNAME === 'admin'}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新增临床账号</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="space-y-2"><Label>登录工号</Label><Input placeholder="输入唯一工号" value={newUser.USERNAME} onChange={e => setNewUser({...newUser, USERNAME: e.target.value})} /></div>
            <div className="space-y-2"><Label>初始密码</Label><Input type="password" value={newUser.PASSWORD} onChange={e => setNewUser({...newUser, PASSWORD: e.target.value})} /></div>
            <div className="space-y-2"><Label>真实姓名</Label><Input placeholder="姓名" value={newUser.REAL_NAME} onChange={e => setNewUser({...newUser, REAL_NAME: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>系统角色</Label>
              <Select value={newUser.ROLE} onValueChange={(v: 'admin' | 'operator') => setNewUser({...newUser, ROLE: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="operator">临床操作员</SelectItem><SelectItem value="admin">系统管理员</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddUser} disabled={submitting} className="w-full font-bold">{submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}确认并同步中心库</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
