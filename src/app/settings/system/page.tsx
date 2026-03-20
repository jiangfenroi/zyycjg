
"use client"

import * as React from 'react'
import { 
  Palette, 
  Save, 
  Loader2, 
  Layout, 
  FolderOpen, 
  BookOpen,
  Monitor,
  UserPlus,
  Trash2
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

  const handleSaveBasic = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const success = await DataService.updateSystemSettings(settings)
      if (success) toast({ title: "配置已全院同步" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddUser = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!newUser.USERNAME || submitting) return
    setSubmitting(true)
    try {
      const res = await DataService.addUser(newUser)
      if (res.success) {
        toast({ title: "账号已生效" })
        setIsAddUserOpen(false)
        loadData()
        setNewUser({ USERNAME: '', PASSWORD: '', REAL_NAME: '', ROLE: 'operator' })
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
        <p className="text-muted-foreground text-sm">中心化集成与品牌资产配置</p>
      </div>

      <Tabs defaultValue="brand">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="brand">品牌与视觉</TabsTrigger>
          <TabsTrigger value="clinical">临床集成</TabsTrigger>
          <TabsTrigger value="storage">中心存储</TabsTrigger>
          <TabsTrigger value="users">权限中心</TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="space-y-6 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4 text-primary" /> 视觉配置</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>系统名称</Label>
                  <Input value={settings.SYSTEM_NAME} onChange={e => setSettings({...settings, SYSTEM_NAME: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>默认 Logo 字符</Label>
                  <Input value={settings.SYSTEM_LOGO_TEXT} maxLength={1} onChange={e => setSettings({...settings, SYSTEM_LOGO_TEXT: e.target.value})} />
                </div>
                <Button type="button" className="w-full font-bold" onClick={handleSaveBasic} disabled={submitting}>
                  {submitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  保存全院基础配置
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clinical" className="pt-4">
           <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Monitor className="h-4 w-4 text-primary" /> PACS 调阅配置</CardTitle>
                <CardDescription>配置浏览器唤醒 PACS 调阅的规则。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>影像调阅 URL 模板</Label>
                  <Input 
                    placeholder="http://pacs_server/?ChtId=${id}" 
                    className="font-mono text-xs"
                    value={settings.PACS_URL_TEMPLATE} 
                    onChange={e => setSettings({...settings, PACS_URL_TEMPLATE: e.target.value})} 
                  />
                  <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg flex items-start gap-3 mt-4">
                    <BookOpen className="h-4 w-4 text-primary mt-0.5" />
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      系统会自动将 <code>{"${id}"}</code> 替换为实际的患者 ID。<br />
                      示例：<code>{"http://PACS_SERVER/view?id=${id}"}</code><br />
                      配置后，所有终端均会同步此调阅地址。
                    </div>
                  </div>
                </div>
                <Button type="button" onClick={handleSaveBasic} disabled={submitting} className="font-bold">保存集成配置</Button>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="storage" className="pt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FolderOpen className="h-4 w-4 text-primary" /> 共享存储路径</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>中心物理路径 (UNC)</Label>
                <Input placeholder="\\Server\SharedFolder" value={settings.STORAGE_PATH} onChange={e => setSettings({...settings, STORAGE_PATH: e.target.value})} />
              </div>
              <Button type="button" onClick={handleSaveBasic} disabled={submitting} className="font-bold">同步存储配置</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="pt-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">全院人员中心</CardTitle>
              </div>
              <Button type="button" size="sm" onClick={() => setIsAddUserOpen(true)} className="font-bold"><UserPlus className="h-4 w-4 mr-2" /> 新增人员</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>工号</TableHead><TableHead>姓名</TableHead><TableHead>角色</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.ID} className="text-xs">
                      <TableCell className="font-mono">{u.USERNAME}</TableCell>
                      <TableCell className="font-bold">{u.REAL_NAME}</TableCell>
                      <TableCell><Badge variant={u.ROLE === 'admin' ? 'default' : 'outline'}>{u.ROLE === 'admin' ? '管理' : '操作'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if(confirm('确定注销？')) DataService.deleteUser(u.ID, u.USERNAME).then(() => loadData()) }} disabled={u.USERNAME === 'admin'}><Trash2 className="h-3.5 w-3.5" /></Button>
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
            <div className="space-y-2"><Label>工号</Label><Input value={newUser.USERNAME} onChange={e => setNewUser({...newUser, USERNAME: e.target.value})} /></div>
            <div className="space-y-2"><Label>密码</Label><Input type="password" value={newUser.PASSWORD} onChange={e => setNewUser({...newUser, PASSWORD: e.target.value})} /></div>
            <div className="space-y-2"><Label>姓名</Label><Input value={newUser.REAL_NAME} onChange={e => setNewUser({...newUser, REAL_NAME: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={newUser.ROLE} onValueChange={(v: 'admin' | 'operator') => setNewUser({...newUser, ROLE: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="operator">操作员</SelectItem><SelectItem value="admin">管理员</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button type="button" onClick={handleAddUser} disabled={submitting} className="w-full font-bold">同步至中心库</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
