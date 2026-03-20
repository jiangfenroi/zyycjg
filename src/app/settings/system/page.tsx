
"use client"

import * as React from 'react'
import { Palette, Save, Loader2, Image as ImageIcon, Layout, FolderOpen, UserCog, UserPlus, Trash2, Key, Upload } from 'lucide-react'
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
  })
  const [users, setUsers] = React.useState<User[]>([])
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false)
  const [newUser, setNewUser] = React.useState({ USERNAME: '', PASSWORD: '', REAL_NAME: '', ROLE: 'operator' as any })

  const loadData = React.useCallback(async () => {
    setLoading(true)
    const [s, u] = await Promise.all([DataService.getSystemSettings(), DataService.getUsers()])
    setSettings(s); setUsers(u); setLoading(false);
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const handleSaveBasic = async () => {
    setSubmitting(true)
    const success = await DataService.updateSystemSettings({ 
      SYSTEM_NAME: settings.SYSTEM_NAME, 
      SYSTEM_LOGO_TEXT: settings.SYSTEM_LOGO_TEXT,
      STORAGE_PATH: settings.STORAGE_PATH
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
          toast({ title: "上传成功" });
          loadData();
        }
      } catch (e: any) {
        toast({ variant: "destructive", title: "错误", description: e.message });
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleAddUser = async () => {
    setSubmitting(true)
    const res = await DataService.addUser(newUser)
    if (res.success) {
      toast({ title: "用户已同步" }); setIsAddUserOpen(false); loadData();
    }
    setSubmitting(false)
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">全院管理中心</h1>
        <p className="text-muted-foreground">品牌视觉、存储路径与全院账号集约化管理</p>
      </div>

      <Tabs defaultValue="brand">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="brand">视觉与品牌</TabsTrigger>
          <TabsTrigger value="storage">中心存储</TabsTrigger>
          <TabsTrigger value="users">人员权限</TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" /> 品牌配置</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>系统名称</Label>
                  <Input value={settings.SYSTEM_NAME} onChange={e => setSettings({...settings, SYSTEM_NAME: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Logo 文字 (单字)</Label>
                  <Input value={settings.SYSTEM_LOGO_TEXT} maxLength={1} onChange={e => setSettings({...settings, SYSTEM_LOGO_TEXT: e.target.value})} />
                </div>
                <Button className="w-full" onClick={handleSaveBasic} disabled={submitting}>保存基本信息</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="h-4 w-4" /> 资产管理</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs">系统 Logo 图片</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded border overflow-hidden flex items-center justify-center">
                      {settings.SYSTEM_LOGO_URL ? <img src={`app-file://${settings.SYSTEM_LOGO_URL}`} className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 opacity-20" />}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleUploadAsset('SYSTEM_LOGO_URL')} disabled={submitting}>
                      <Upload className="h-3.5 w-3.5 mr-2" /> 同步 Logo
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs">登录页背景图</Label>
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

        <TabsContent value="storage">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FolderOpen className="h-4 w-4" /> 路径映射</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>全院统一物理存储 UNC 路径</Label>
                <Input placeholder="\\172.17.16.18\MediStorage" value={settings.STORAGE_PATH} onChange={e => setSettings({...settings, STORAGE_PATH: e.target.value})} />
                <p className="text-[10px] text-muted-foreground bg-blue-50 p-2 rounded">
                  设置为中心存储后，系统资产及患者报告将自动在此分拣。
                </p>
              </div>
              <Button onClick={handleSaveBasic} disabled={submitting}>确认全院同步</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle className="text-base">人员库</CardTitle></div>
              <Button size="sm" onClick={() => setIsAddUserOpen(true)}><UserPlus className="h-4 w-4 mr-2" /> 新增</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>工号</TableHead><TableHead>姓名</TableHead><TableHead>角色</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.ID} className="text-xs">
                      <TableCell className="font-mono">{u.USERNAME}</TableCell>
                      <TableCell>{u.REAL_NAME}</TableCell>
                      <TableCell><Badge variant="outline">{u.ROLE}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { if(confirm('注销此人？')) DataService.deleteUser(u.ID, u.USERNAME).then(() => loadData()) }} disabled={u.USERNAME === 'admin'}><Trash2 className="h-3 w-3" /></Button>
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
          <DialogHeader><DialogTitle>新增账户</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <Input placeholder="工号" value={newUser.USERNAME} onChange={e => setNewUser({...newUser, USERNAME: e.target.value})} />
            <Input type="password" placeholder="密码" value={newUser.PASSWORD} onChange={e => setNewUser({...newUser, PASSWORD: e.target.value})} />
            <Input placeholder="姓名" value={newUser.REAL_NAME} onChange={e => setNewUser({...newUser, REAL_NAME: e.target.value})} />
            <Select value={newUser.ROLE} onValueChange={v => setNewUser({...newUser, ROLE: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="operator">操作员</SelectItem><SelectItem value="admin">管理员</SelectItem></SelectContent>
            </Select>
          </div>
          <DialogFooter><Button onClick={handleAddUser} disabled={submitting}>确认同步</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
