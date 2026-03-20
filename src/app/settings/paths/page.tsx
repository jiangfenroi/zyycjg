
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
      toast({ variant: "destructive", title: "校验失败", description: "计划名称不能为空" })
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
      toast({ title: "随访计划已入库" })
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
          <h1 className="text-3xl font-bold tracking-tight text-primary">标准化随访计划配置</h1>
          <p className="text-muted-foreground mt-1">定义临床指南随访周期与权威处置路径</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> 新增计划</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>定义标准化临床随访计划</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>计划名称</Label>
                <Input value={newPath.NAME} onChange={e => setNewPath({...newPath, NAME: e.target.value})} placeholder="例如：肺结节标准化随访管理计划" />
              </div>
              <div className="space-y-2">
                <Label>临床指南链接</Label>
                <Input value={newPath.URL} onChange={e => setNewPath({...newPath, URL: e.target.value})} placeholder="公众号文章或 PDF 路径 URL" />
              </div>
              <div className="space-y-2">
                <Label>计划核心逻辑说明</Label>
                <Textarea value={newPath.DESCRIPTION} onChange={e => setNewPath({...newPath, DESCRIPTION: e.target.value})} placeholder="简述随访周期要求..." />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPath} disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                保存计划
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            临床指南库
          </CardTitle>
          <CardDescription>此处定义的计划将在异常结果登记时关联，用于驱动后续的自动提醒流程。</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>计划名称</TableHead>
                <TableHead>参考指南</TableHead>
                <TableHead>核心逻辑</TableHead>
                <TableHead>同步日期</TableHead>
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
                      <a href={p.URL} target="_blank" className="flex items-center gap-1 text-blue-600 font-bold hover:underline">
                        <LinkIcon className="h-3 w-3" /> 查看指南
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[300px] truncate" title={p.DESCRIPTION}>{p.DESCRIPTION || '-'}</TableCell>
                  <TableCell className="font-mono">{p.CREATE_DATE}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">暂无计划定义</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
