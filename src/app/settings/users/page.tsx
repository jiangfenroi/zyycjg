"use client"

import * as React from 'react'
import { 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  UserCog, 
  Key, 
  RefreshCcw,
  ShieldAlert
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { User } from '@/lib/types'

export default function UserManagementPage() {
  const { toast } = useToast()
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isResetOpen, setIsResetOpen] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)

  const [newUser, setNewUser] = React.useState({
    USERNAME: '',
    PASSWORD: '',
    REAL_NAME: '',
    ROLE: 'operator' as 'admin' | 'operator'
  })

  const [newPassword, setNewPassword] = React.useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.query('SELECT ID, USERNAME, REAL_NAME, ROLE, CREATE_DATE FROM SP_USERS ORDER BY ID DESC')
        if (result.success) setUsers(result.data)
      }
    } catch (err) {
      toast({ variant: "destructive", title: "数据加载失败", description: "无法连接到数据库" })
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddUser = async () => {
    if (!newUser.USERNAME || !newUser.PASSWORD || !newUser.REAL_NAME) {
      toast({ variant: "destructive", title: "添加失败", description: "请填写完整信息" })
      return
    }

    try {
      const sql = 'INSERT INTO SP_USERS (USERNAME, PASSWORD, REAL_NAME, ROLE, CREATE_DATE) VALUES (?, ?, ?, ?, ?)'
      const result = await window.electronAPI.query(sql, [
        newUser.USERNAME, 
        newUser.PASSWORD, 
        newUser.REAL_NAME, 
        newUser.ROLE,
        new Date().toISOString().split('T')[0]
      ])
      
      if (result.success) {
        toast({ title: "用户已创建", description: `账号 ${newUser.USERNAME} 已就绪` })
        setIsAddOpen(false)
        fetchUsers()
        setNewUser({ USERNAME: '', PASSWORD: '', REAL_NAME: '', ROLE: 'operator' })
      } else {
        toast({ variant: "destructive", title: "创建失败", description: result.error })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "系统错误" })
    }
  }

  const handleDeleteUser = async (id: number, username: string) => {
    if (username === 'admin') {
      toast({ variant: "destructive", title: "禁止操作", description: "主管理员账户不可删除" })
      return
    }

    if (!confirm(`确定要永久注销用户 ${username} 吗？`)) return

    try {
      const result = await window.electronAPI.query('DELETE FROM SP_USERS WHERE ID = ?', [id])
      if (result.success) {
        toast({ title: "用户已删除" })
        fetchUsers()
      }
    } catch (err) {
      toast({ variant: "destructive", title: "删除失败" })
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return

    try {
      const result = await window.electronAPI.query(
        'UPDATE SP_USERS SET PASSWORD = ? WHERE ID = ?',
        [newPassword, selectedUser.ID]
      )
      if (result.success) {
        toast({ title: "密码重置成功", description: `用户 ${selectedUser.USERNAME} 的密码已更新。` })
        setIsResetOpen(false)
        setNewPassword('')
      }
    } catch (err) {
      toast({ variant: "destructive", title: "重置失败" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">用户权限管理</h1>
          <p className="text-muted-foreground mt-1">管理系统操作员账号，配置角色权限与安全密码。</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" /> 新增操作员
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增系统账户</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>登录用户名 (工号/拼音)</Label>
                <Input value={newUser.USERNAME} onChange={e => setNewUser({...newUser, USERNAME: e.target.value})} placeholder="例如: wangwu" />
              </div>
              <div className="space-y-2">
                <Label>登录密码</Label>
                <Input type="password" value={newUser.PASSWORD} onChange={e => setNewUser({...newUser, PASSWORD: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>真实姓名</Label>
                <Input value={newUser.REAL_NAME} onChange={e => setNewUser({...newUser, REAL_NAME: e.target.value})} placeholder="例如: 王五" />
              </div>
              <div className="space-y-2">
                <Label>系统角色</Label>
                <Select value={newUser.ROLE} onValueChange={v => setNewUser({...newUser, ROLE: v as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">普通操作员</SelectItem>
                    <SelectItem value="admin">系统管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>取消</Button>
              <Button onClick={handleAddUser}>确认创建</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            当前系统用户库
          </CardTitle>
          <CardDescription>管理员拥有增删、重置其他用户密码的最高权限。</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>用户名</TableHead>
                <TableHead>真实姓名</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>创建日期</TableHead>
                <TableHead className="text-right">安全操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10">同步用户信息中...</TableCell></TableRow>
              ) : users.map((user) => (
                <TableRow key={user.ID}>
                  <TableCell className="font-mono">{user.USERNAME}</TableCell>
                  <TableCell className="font-medium">{user.REAL_NAME}</TableCell>
                  <TableCell>
                    <Badge variant={user.ROLE === 'admin' ? 'default' : 'secondary'}>
                      {user.ROLE === 'admin' ? '管理员' : '操作员'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{user.CREATE_DATE}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedUser(user);
                          setIsResetOpen(true);
                        }}
                      >
                        <Key className="mr-1 h-3 w-3" /> 重置密码
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteUser(user.ID, user.USERNAME)}
                        disabled={user.USERNAME === 'admin'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              安全重置 - {selectedUser?.REAL_NAME}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>设置新密码</Label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)}
                placeholder="请输入新密码..."
              />
            </div>
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
              重置密码后，用户下次登录需使用新密码，且之前的密码将立即失效。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleResetPassword}>立即更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
