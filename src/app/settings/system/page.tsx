
"use client"

import * as React from 'react'
import { 
  Palette, 
  Save, 
  Loader2, 
  ShieldAlert, 
  Key, 
  FolderOpen, 
  UserCog, 
  UserPlus, 
  Trash2, 
  ShieldCheck,
  Search,
  RefreshCcw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { DataService } from '@/services/data-service'
import { SystemSettings, User } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function GlobalManagementPage() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [currentUser, setCurrentUser] = React.useState<any>(null)
  
  // 系统设置状态
  const [settings, setSettings] = React.useState<SystemSettings>({
    SYSTEM_NAME: '',
    SYSTEM_LOGO_TEXT: '',
    SYSTEM_LOGO_URL: '',
    STORAGE_PATH: '',
  })

  // 用户管理状态
  const [users, setUsers] = React.useState<User[]>([])
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false)
  const [isResetPassOpen, setIsResetPassOpen] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [newPassword, setNewPassword] = React.useState('')
  const [newUser, setNewUser] = React.useState({
    USERNAME: '',
    PASSWORD: '',
    REAL_NAME: '',
    ROLE: 'operator' as 'admin' | 'operator'
  })

  const loadAllData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [sData, uData] = await Promise.all([
        DataService.getSystemSettings(),
        DataService.getUsers()
      ])
      setSettings(sData)
      setUsers(uData)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (user) setCurrentUser(JSON.parse(user))
    loadAllData()
  }, [loadAllData])

  const handleSaveSettings = async () => {
    if (!settings.SYSTEM_NAME) {
      toast({ variant: "destructive", title: "验证失败", description: "系统名称不能为空" })
      return
    }
    setSubmitting(true)
    const success = await DataService.updateSystemSettings(settings)
    if (success) {
      toast({ title: "全院配置已更新", description: "设置已同步至中心数据库。" })
    }
    setSubmitting(false)
  }

  const handleAddUser = async () => {
    if (!newUser.USERNAME || !newUser.PASSWORD || !newUser.REAL_NAME) {
      toast({ variant: "destructive", title: "校验失败", description: "请填写完整的用户信息" })
      return
    }
    setSubmitting(true)
    const result = await DataService.addUser(newUser)
    if (result.success) {
      toast({ title: "用户已同步", description: `账号 ${newUser.USERNAME} 已入库。` })
      setIsAddUserOpen(false)
      loadAllData()
      setNewUser({ USERNAME: '', PASSWORD: '', REAL_NAME: '', ROLE: 'operator' })
    } else {
      toast({ variant: "destructive", title: "创建失败", description: result.error })
    }
    setSubmitting(false)
  }

  const handleDeleteUser = async (id: number, username: string) => {
    if (username === 'admin') {
      toast({ variant: "destructive", title: "禁止操作", description: "主管理员账户不可删除" })
      return
    }
    if (!confirm(`确定要注销用户 ${username} 吗？`)) return
    const success = await DataService.deleteUser(id, username)
    if (success) {
      toast({ title: "用户已注销" })
      loadAllData()
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return
    setSubmitting(true)
    const success = await DataService.resetPassword(selectedUser.ID, selectedUser.USERNAME, newPassword)
    if (success) {
      toast({ title: "凭据重置成功" })
      setIsResetPassOpen(false)
      setNewPassword('')
    }
    setSubmitting(false)
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">全院管理中心</h1>
        <p className="text-muted-foreground mt-1">集约化管理全院品牌标识、附件存储及人员权限。</p>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="config">基础配置</TabsTrigger>
          <TabsTrigger value="users">人员权限中心</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-5 w-5 text-primary" /> 品牌与标识
                </CardTitle>
                <CardDescription>配置全院终端同步显示的品牌信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>系统显示名称</Label>
                  <Input value={settings.SYSTEM_NAME} onChange={e => setSettings({...settings, SYSTEM_NAME: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Logo 简写 (单字)</Label>
                  <Input value={settings.SYSTEM_LOGO_TEXT} maxLength={1} onChange={e => setSettings({...settings, SYSTEM_LOGO_TEXT: e.target.value})} />
                </div>
                <Button className="w-full" onClick={handleSaveSettings} disabled={submitting}>
                  <Save className="mr-2 h-4 w-4" /> 保存品牌设置
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderOpen className="h-5 w-5 text-secondary" /> 中心化存储路径
                </CardTitle>
                <CardDescription>配置全院统一的 PDF 附件物理存储根目录</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>全院物理存储 UNC 路径</Label>
                  <Input placeholder="\\SERVER_IP\MediStorage" value={settings.STORAGE_PATH} onChange={e => setSettings({...settings, STORAGE_PATH: e.target.value})} />
                  <p className="text-[10px] text-muted-foreground bg-muted p-2 rounded">
                    所有 PDF 报告将按 [患者ID/类别] 自动在该目录下分拣存储。
                  </p>
                </div>
                <Button variant="secondary" className="w-full" onClick={handleSaveSettings} disabled={submitting}>
                   <Save className="mr-2 h-4 w-4" /> 更新存储路径
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserCog className="h-5 w-5 text-primary" /> 操作员账号库
                  </CardTitle>
                  <CardDescription>全院中心化账号管理，支持重置密码与注销</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsAddUserOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" /> 新增操作员
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>工号/用户名</TableHead>
                    <TableHead>真实姓名</TableHead>
                    <TableHead>系统角色</TableHead>
                    <TableHead>建档日期</TableHead>
                    <TableHead className="text-right">安全操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.ID} className="text-xs">
                      <TableCell className="font-mono font-bold">{user.USERNAME}</TableCell>
                      <TableCell>{user.REAL_NAME}</TableCell>
                      <TableCell>
                        <Badge variant={user.ROLE === 'admin' ? 'default' : 'secondary'} className="text-[9px]">
                          {user.ROLE === 'admin' ? '管理员' : '操作员'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.CREATE_DATE}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user); setIsResetPassOpen(true); }}>
                            <Key className="h-3 w-3 mr-1" /> 重置
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteUser(user.ID, user.USERNAME)} disabled={user.USERNAME === 'admin'}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 用户新增弹窗 */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新增系统操作员</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="space-y-2"><Label>登录账号</Label><Input value={newUser.USERNAME} onChange={e => setNewUser({...newUser, USERNAME: e.target.value})} placeholder="建议使用工号" /></div>
            <div className="space-y-2"><Label>登录密码</Label><Input type="password" value={newUser.PASSWORD} onChange={e => setNewUser({...newUser, PASSWORD: e.target.value})} /></div>
            <div className="space-y-2"><Label>真实姓名</Label><Input value={newUser.REAL_NAME} onChange={e => setNewUser({...newUser, REAL_NAME: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>系统角色</Label>
              <Select value={newUser.ROLE} onValueChange={v => setNewUser({...newUser, ROLE: v as any})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="operator">临床操作员</SelectItem><SelectItem value="admin">系统管理员</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddUser} disabled={submitting}>确认同步至中心库</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 密码重置弹窗 */}
      <Dialog open={isResetPassOpen} onOpenChange={setIsResetPassOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>安全凭据重置 - {selectedUser?.REAL_NAME}</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>设置新登录密码</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="输入新密码..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleResetPassword} disabled={submitting}>确认更新凭据</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
