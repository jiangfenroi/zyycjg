
"use client"

import * as React from 'react'
import { Plus, Trash2, Link as LinkIcon, Save, Loader2, Route, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { DataService } from '@/services/data-service'
import { FollowUpPath } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export default function FollowUpPathsPage() {
  const { toast } = useToast()
  const [paths, setPaths] = React.useState<FollowUpPath[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const [newPath, setNewPath] = React.useState({
    NAME: '',
    URL: '',
    DESCRIPTION: ''
  })

  const fetchPaths = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await DataService.getFollowUpPaths()
      setPaths(data)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchPaths()
  }, [fetchPaths])

  const handleAddPath = async () => {
    if (!newPath.NAME) {
      toast({ variant: "destructive", title: "校验失败", description: "路径名称不能为空" })
      return
    }
    setSubmitting(true)
    const success = await DataService.addFollowUpPath({
      ID: `P${Date.now()}`,
      NAME: newPath.NAME,
      URL: newPath.URL,
      DESCRIPTION: newPath.DESCRIPTION,
      CREATE_DATE: new Date().toISOString().split('T')[0]
    })
    if (success) {
      toast({ title: "随访路径已入库" })
      setIsAddOpen(false)
      fetchPaths()
      setNewPath({ NAME: '', URL: '', DESCRIPTION: '' })
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要永久删除随访路径 ${name} 吗？`)) return
    const success = await DataService.deleteFollowUpPath(id)
    if (success) {
      toast({ title: "删除成功" })
      fetchPaths()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">随访路径库管理</h1>
          <p className="text-muted-foreground mt-1">自定义全院临床标准化随访路径及处置标准</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> 新增路径定义</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>定义随访路径</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>路径名称</Label>
                <Input value={newPath.NAME} onChange={e => setNewPath({...newPath, NAME: e.target.value})} placeholder="例如：肺结节标准化随访路径" />
              </div>
              <div className="space-y-2">
                <Label>参考文档链接</Label>
                <Input value={newPath.URL} onChange={e => setNewPath({...newPath, URL: e.target.value})} placeholder="输入临床指南 URL 或文档路径" />
              </div>
              <div className="space-y-2">
                <Label>路径逻辑描述</Label>
                <Textarea value={newPath.DESCRIPTION} onChange={e => setNewPath({...newPath, DESCRIPTION: e.target.value})} placeholder="简述随访周期及关键操作逻辑..." />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPath} disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                保存路径至数据库
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            中心数据库存储路径列表
          </CardTitle>
          <CardDescription>此处定义的随访路径将供异常结果登记时选择，用于驱动自动化提醒引擎。</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>路径名称</TableHead>
                <TableHead>参考链接</TableHead>
                <TableHead>描述说明</TableHead>
                <TableHead>创建日期</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : paths.length > 0 ? paths.map((p) => (
                <TableRow key={p.ID} className="text-xs">
                  <TableCell className="font-bold">{p.NAME}</TableCell>
                  <TableCell>
                    {p.URL ? (
                      <a href={p.URL} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline">
                        <LinkIcon className="h-3 w-3" /> 点击跳转
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[250px] truncate" title={p.DESCRIPTION}>{p.DESCRIPTION || '-'}</TableCell>
                  <TableCell className="font-mono">{p.CREATE_DATE}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.ID, p.NAME)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">暂无路径定义</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
