
"use client"

import * as React from 'react'
import { Plus, Trash2, Link as LinkIcon, Save, Loader2, Route } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { DataService } from '@/services/data-service'
import { FollowUpPath } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'

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
    const data = await DataService.getFollowUpPaths()
    setPaths(data)
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchPaths()
  }, [fetchPaths])

  const handleAddPath = async () => {
    if (!newPath.NAME) return
    setSubmitting(true)
    const success = await DataService.addFollowUpPath({
      ID: `P${Date.now()}`,
      NAME: newPath.NAME,
      URL: newPath.URL,
      DESCRIPTION: newPath.DESCRIPTION,
      CREATE_DATE: new Date().toISOString().split('T')[0]
    })
    if (success) {
      toast({ title: "随访路径已新增" })
      setIsAddOpen(false)
      fetchPaths()
      setNewPath({ NAME: '', URL: '', DESCRIPTION: '' })
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">随访路径配置</h1>
          <p className="text-muted-foreground mt-1">定义临床指南随访周期与参考路径链接</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> 新增随访路径</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>定义临床随访路径</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>路径名称</Label>
                <Input value={newPath.NAME} onChange={e => setNewPath({...newPath, NAME: e.target.value})} placeholder="如：肺结节随访管理路径" />
              </div>
              <div className="space-y-2">
                <Label>指南参考链接 (WeChat/PDF URL)</Label>
                <Input value={newPath.URL} onChange={e => setNewPath({...newPath, URL: e.target.value})} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>路径说明</Label>
                <Input value={newPath.DESCRIPTION} onChange={e => setNewPath({...newPath, DESCRIPTION: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPath} disabled={submitting}>确认保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            临床路径库
          </CardTitle>
          <CardDescription>此处定义的路径将在重要异常结果登记时作为选项提供。</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>路径名称</TableHead>
                <TableHead>参考指南</TableHead>
                <TableHead>描述说明</TableHead>
                <TableHead>创建日期</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : paths.length > 0 ? paths.map((p) => (
                <TableRow key={p.ID} className="text-xs">
                  <TableCell className="font-bold">{p.NAME}</TableCell>
                  <TableCell>
                    {p.URL ? (
                      <a href={p.URL} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline">
                        <LinkIcon className="h-3 w-3" /> 指南链接
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.DESCRIPTION || '-'}</TableCell>
                  <TableCell className="font-mono">{p.CREATE_DATE}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">暂无随访路径定义</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
