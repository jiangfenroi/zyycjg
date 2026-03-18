"use client"

import * as React from 'react'
import { FileText, Search, Upload, Download, Eye, Trash2, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { DataService } from '@/services/data-service'
import { PatientDocument, Person } from '@/lib/types'
import Link from 'next/link'

export default function ReportsPage() {
  const { toast } = useToast()
  const [docs, setDocs] = React.useState<PatientDocument[]>([])
  const [persons, setPersons] = React.useState<Person[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filterType, setFilterType] = React.useState('all')
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false)
  const [uploadForm, setUploadForm] = React.useState({
    personId: '',
    type: 'PE_REPORT' as 'PE_REPORT' | 'IMAGING' | 'PATHOLOGY'
  })

  const loadData = async () => {
    setLoading(true)
    const [d, p] = await Promise.all([
      DataService.getDocuments(),
      DataService.getPatients()
    ])
    setDocs(d)
    setPersons(p)
    setLoading(false)
  }

  React.useEffect(() => {
    loadData()
  }, [])

  const filteredDocs = docs.filter(doc => {
    const matchesType = filterType === 'all' || doc.TYPE === filterType;
    const person = persons.find(p => p.PERSONID === doc.PERSONID);
    const matchesSearch = doc.FILENAME.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          person?.PERSONNAME.includes(searchTerm) ||
                          doc.PERSONID.includes(searchTerm);
    return matchesType && matchesSearch;
  });

  const handleUploadClick = async () => {
    if (!uploadForm.personId) {
      toast({ variant: "destructive", title: "上传失败", description: "请先选择关联患者。" })
      return
    }

    const success = await DataService.uploadDocument(uploadForm.personId, uploadForm.type)
    
    if (success) {
      toast({ title: "上传成功", description: "报告已存档并同步至数据库。" })
      setIsUploadDialogOpen(false)
      loadData() // 刷新列表
    } else {
      toast({ variant: "destructive", title: "上传取消或失败", description: "请检查数据库连接或权限。" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">报告附件管理</h1>
          <p className="text-muted-foreground mt-1">管理关联电子文档与影像扫描件。</p>
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" /> 上传报告
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>上传新报告附件</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>关联患者</Label>
                <Select value={uploadForm.personId} onValueChange={v => setUploadForm({...uploadForm, personId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择患者..." />
                  </SelectTrigger>
                  <SelectContent>
                    {persons.map(p => (
                      <SelectItem key={p.PERSONID} value={p.PERSONID}>
                        {p.PERSONNAME} ({p.PERSONID})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>报告分类</Label>
                <Select value={uploadForm.type} onValueChange={v => setUploadForm({...uploadForm, type: v as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PE_REPORT">体检报告汇总</SelectItem>
                    <SelectItem value="IMAGING">影像检查结果</SelectItem>
                    <SelectItem value="PATHOLOGY">病理组织报告</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>取消</Button>
              <Button onClick={handleUploadClick}>选择并上传文件</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">文件检索与筛选</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">文件类型</label>
              <Select defaultValue="all" onValueChange={setFilterType}>
                <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="PE_REPORT">体检报告汇总</SelectItem>
                  <SelectItem value="IMAGING">影像检查结果</SelectItem>
                  <SelectItem value="PATHOLOGY">病理组织报告</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">关键字搜索</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="文件名、患者名..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">文档库列表</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>文件名称</TableHead>
                    <TableHead>关联患者</TableHead>
                    <TableHead>文档分类</TableHead>
                    <TableHead>上传日期</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10">同步数据库记录中...</TableCell></TableRow>
                  ) : filteredDocs.length > 0 ? filteredDocs.map((doc) => {
                    const person = persons.find(p => p.PERSONID === doc.PERSONID)
                    return (
                      <TableRow key={doc.ID}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            {doc.FILENAME}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/patients/${doc.PERSONID}`} className="hover:underline text-primary">
                            {person?.PERSONNAME}
                          </Link>
                          <span className="text-xs text-muted-foreground ml-2">({doc.PERSONID})</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {doc.TYPE === 'IMAGING' ? '影像报告' : doc.TYPE === 'PE_REPORT' ? '体检汇总' : '病理报告'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{doc.UPLOAD_DATE}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => toast({ title: "正在打开本地目录..." })}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => toast({ title: "下载请求已发送" })}><Download className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">暂无相关附件。</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
