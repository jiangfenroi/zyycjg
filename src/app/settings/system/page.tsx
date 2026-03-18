"use client"

import * as React from 'react'
import { Palette, Save, Loader2, Info } from 'lucide-react'
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
  const [settings, setSettings] = React.useState<SystemSettings>({
    SYSTEM_NAME: '',
    SYSTEM_LOGO_TEXT: ''
  })

  React.useEffect(() => {
    DataService.getSystemSettings().then(data => {
      setSettings(data)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    if (!settings.SYSTEM_NAME || !settings.SYSTEM_LOGO_TEXT) {
      toast({ variant: "destructive", title: "验证失败", description: "名称和Logo文字不能为空" })
      return
    }

    setSubmitting(true)
    const success = await DataService.updateSystemSettings(settings)
    if (success) {
      toast({ title: "设置已同步", description: "系统身份信息已更新，重启或刷新客户端生效。" })
    } else {
      toast({ variant: "destructive", title: "更新失败", description: "请检查数据库连接" })
    }
    setSubmitting(false)
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">系统身份设置</h1>
        <p className="text-muted-foreground mt-1">自定义网络版客户端的展示名称与品牌标识。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            品牌自定义
          </CardTitle>
          <CardDescription>设置将保存至中心服务器，所有连接的客户端均会同步显示。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>程序显示名称</Label>
            <Input 
              value={settings.SYSTEM_NAME} 
              onChange={e => setSettings({...settings, SYSTEM_NAME: e.target.value})}
              placeholder="例如: 某某医院体检中心管理系统"
            />
          </div>
          
          <div className="space-y-2">
            <Label>侧边栏 Logo 文字 (1-2个字符)</Label>
            <div className="flex items-center gap-4">
              <Input 
                className="w-24 text-center font-bold text-lg"
                value={settings.SYSTEM_LOGO_TEXT} 
                maxLength={2}
                onChange={e => setSettings({...settings, SYSTEM_LOGO_TEXT: e.target.value})}
              />
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center text-secondary-foreground font-bold text-2xl shadow-inner">
                {settings.SYSTEM_LOGO_TEXT || '?'}
              </div>
              <p className="text-xs text-muted-foreground">预览效果</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-md flex gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <b>管理员提示：</b> 修改完成后，正在运行的客户端可能需要重新加载或重启才能完全展示新的品牌标识。此设置存储在中心数据库 SP_SETTINGS 表中。
            </p>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            保存全局配置
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
