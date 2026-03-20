
"use client"

import * as React from 'react'
import { Palette, Save, Loader2, Upload, ShieldAlert, Key, FolderOpen, Database } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { DataService } from '@/services/data-service'
import { SystemSettings } from '@/lib/types'

export default function SystemSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [adminPassword, setAdminPassword] = React.useState('')
  const [currentUser, setCurrentUser] = React.useState<any>(null)
  
  const [settings, setSettings] = React.useState<SystemSettings>({
    SYSTEM_NAME: '',
    SYSTEM_LOGO_TEXT: '',
    SYSTEM_LOGO_URL: '',
    STORAGE_PATH: '',
  })

  React.useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (user) setCurrentUser(JSON.parse(user))
    
    DataService.getSystemSettings().then(data => {
      setSettings(data)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    if (!settings.SYSTEM_NAME) {
      toast({ variant: "destructive", title: "验证失败", description: "系统名称不能为空" })
      return
    }

    setSubmitting(true)
    const success = await DataService.updateSystemSettings(settings)
    if (success) {
      toast({ title: "全院配置已更新", description: "设置已同步至中心数据库。" })
    } else {
      toast({ variant: "destructive", title: "同步失败", description: "请检查数据库连接状态" })
    }
    setSubmitting(false)
  }

  const handlePasswordUpdate = async () => {
    if (!adminPassword || adminPassword.length < 6) {
      toast({ variant: "destructive", title: "安全验证", description: "新密码长度至少为 6 位" })
      return
    }
    
    setSubmitting(true)
    const success = await DataService.resetPassword(currentUser.ID, 'admin', adminPassword)
    if (success) {
      toast({ title: "Admin 凭据已更新", description: "下次登录请使用新密码。" })
      setAdminPassword('')
    }
    setSubmitting(false)
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">全院系统配置</h1>
        <p className="text-muted-foreground mt-1">管理品牌标识、中心存储路径及管理员安全权限。</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              品牌定制
            </CardTitle>
            <CardDescription>设置同步至中心库，全院终端通用。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>医院系统显示名称</Label>
              <Input 
                value={settings.SYSTEM_NAME} 
                onChange={e => setSettings({...settings, SYSTEM_NAME: e.target.value})}
              />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={submitting}>
              <Save className="mr-2 h-4 w-4" /> 保存全局品牌
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-secondary" />
              中心附件存储路径
            </CardTitle>
            <CardDescription>配置全院统一的 PDF 报告物理存储位置。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>全院物理存储 UNC 路径</Label>
              <Input 
                placeholder="例如: \\SERVER_IP\MediStorage" 
                value={settings.STORAGE_PATH}
                onChange={e => setSettings({...settings, STORAGE_PATH: e.target.value})}
              />
              <p className="text-[10px] text-muted-foreground bg-slate-50 p-2 rounded border">
                提示：建议使用共享路径。请确保运行程序的 Windows 账户具有读写权限。
              </p>
            </div>
            <Button variant="secondary" className="w-full" onClick={handleSave} disabled={submitting}>
               <Save className="mr-2 h-4 w-4" /> 更新全院路径
            </Button>
          </CardContent>
        </Card>

        {currentUser?.ROLE === 'admin' && (
          <Card className="md:col-span-2 border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-5 w-5" />
                管理员安全中心
              </CardTitle>
              <CardDescription>管理超级管理员账户的登录凭据。</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label>重置 Admin 登录密码</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="password"
                      placeholder="输入至少 6 位新密码" 
                      className="pl-10"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="destructive" onClick={handlePasswordUpdate} disabled={submitting}>
                  立即更新管理员密码
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
