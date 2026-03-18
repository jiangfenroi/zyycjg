"use client"

import * as React from 'react'
import { Palette, Save, Loader2, Info, Upload, Image as ImageIcon, X } from 'lucide-react'
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
  const [uploading, setUploading] = React.useState(false)
  const [settings, setSettings] = React.useState<SystemSettings>({
    SYSTEM_NAME: '',
    SYSTEM_LOGO_TEXT: '',
    SYSTEM_LOGO_URL: ''
  })

  React.useEffect(() => {
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
      toast({ title: "设置已同步", description: "系统身份信息已更新，所有联网终端将同步生效。" })
    } else {
      toast({ variant: "destructive", title: "更新失败", description: "请检查数据库连接" })
    }
    setSubmitting(false)
  }

  const handleLogoUpload = async () => {
    setUploading(true)
    try {
      // 借用 DataService 的上传逻辑，传入特殊 ID "SYSTEM"
      const result = await DataService.uploadDocument('SYSTEM', 'LOGO')
      if (typeof result === 'string') {
        setSettings({ ...settings, SYSTEM_LOGO_URL: result })
        toast({ title: "Logo 上传成功", description: "点击保存后将正式应用。" })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "上传失败" })
    } finally {
      setUploading(false)
    }
  }

  const removeLogo = () => {
    setSettings({ ...settings, SYSTEM_LOGO_URL: '' })
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
          
          <div className="space-y-4">
            <Label>系统 Logo 图片</Label>
            <div className="flex items-start gap-6">
              <div className="relative group">
                <div className="w-24 h-24 bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-primary/20 overflow-hidden shadow-inner">
                  {settings.SYSTEM_LOGO_URL ? (
                    // 在 Electron 中预览本地文件，注意如果是 build 后的版本可能需要处理协议
                    <img 
                      src={`file://${settings.SYSTEM_LOGO_URL}`} 
                      alt="Logo Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100?text=Error")}
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground opacity-30" />
                  )}
                </div>
                {settings.SYSTEM_LOGO_URL && (
                  <button 
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  建议上传 128x128 像素的透明背景图片 (PNG/JPG)。设置后将替换侧边栏上方的文字 Logo。
                </p>
                <Button variant="outline" size="sm" onClick={handleLogoUpload} disabled={uploading}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  选择 Logo 图片
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>文字 Logo 备用 (1-2个字符)</Label>
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
              <p className="text-xs text-muted-foreground">图片未设置时显示</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-md flex gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <b>管理员提示：</b> 修改完成后，所有接入中心服务器的终端均会同步应用新的品牌标识。图片文件将自动同步至中心存储路径。
            </p>
          </div>

          <Button className="w-full h-11" onClick={handleSave} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            保存全局配置
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
