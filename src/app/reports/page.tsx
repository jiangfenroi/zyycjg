
"use client"

import * as React from 'react'
import { FileText, Search, Upload, Download, Eye, Trash2, Plus, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
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
  const [submitting, setSubmitting] = React.useState(false)
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false)
  const [uploadForm, setUploadForm] = React.useState({
    personId: '',
    type: 'PE_REPORT' as 'PE_REPORT' | 'IMAGING' | 'PATHOLOGY',
    date: ''
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
    setUploadForm(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }))
  }, [])

  const filteredDocs = docs.filter(doc => {
    const matchesType = filterType === 'all' || doc.TYPE === filterType;
    const person = persons.find(p => p.PERSONID === doc.PERSONID);
    const matchesSearch = doc.FILENAME.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (person?.PERSONNAME || '').includes(searchTerm) ||
                          doc.PERSONID.includes(searchTerm);
    return matchesType && matchesSearch;
  });

  const handleUploadClick = async () => {
    if (!uploadForm.personId) {
      toast({ variant: "destructive", title: "同步失败", description: "请先选择关联患者电子档案。" })
      return
    }

    setSubmitting(true)
    try {
      const success = await DataService.uploadDocument(uploadForm.personId, uploadForm.type, uploadForm.date)
      if (success) {
        toast({ title: "同步成功", description: "报告已存档并同步至物理中心库及数据库索引。" })
        setIsUploadDialogOpen(false)
        loadData()
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "操作异常", description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownload = async (doc: PatientDocument) => {
    const success = await DataService.downloadDocument(doc.FILE_URL, doc.FILENAME);
    if (success) {
      toast({ title: "导出成功", description: `文件 ${doc.FILENAME} 已保存。` });
    }
  }

  const handleDelete = async (doc: PatientDocument) => {
    if (!confirm(`确定要永久删除物理库中的报告附件 ${doc.FILENAME} 吗？`)) return;
    const success = await DataService.deleteDocument(doc.ID, doc.FILE_URL);
    if (success) {
      toast({ title: "附件已彻底销毁" });
      loadData();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">全院报告附件中心</h1>
          <p className="text-muted-foreground mt-1">基于物理中心库的分层文档管理系统，支持多终端实时调阅及物理同步。</p>
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" /> 同步新报告
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>物理同步新报告附件</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
              <div className="space-y-2">
                <Label>检查/汇总日期</Label>
                <Input type="date" value={uploadForm.date} onChange={e => setUploadForm({...uploadForm, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>关联患者档案</Label>
                <Select value={uploadForm.personId} onValueChange={v => setUploadForm({...uploadForm, personId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="检索并选择患者..." />
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
                <Label>报告分类分拣</Label>
                <Select value={uploadForm.type} onValueChange={v => setUploadForm({...uploadForm, type: v as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PE_REPORT">总检体检报告</SelectItem>
                    <SelectItem value="IMAGING">医学影像扫描报告 (PACS)</SelectItem>
                    <SelectItem value="PATHOLOGY">临床病理组织报告</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>取消</Button>
              <Button onClick={handleUploadClick} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "浏览本地并物理同步"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">中心库多维检索</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">分拣类别</label>
              <Select defaultValue="all" onValueChange={setFilterType}>
                <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">显示全部报告</SelectItem>
                  <SelectItem value="PE_REPORT">体检报告</SelectItem>
                  <SelectItem value="IMAGING">医学影像 (PACS)</SelectItem>
                  <SelectItem value="PATHOLOGY">临床病理</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">模糊关键字</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="文件名、患者、编号..." className="pl-8 text-xs" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">物理中心库索引列表</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>文件标题 (物理名)</TableHead>
                    <TableHead>关联患者</TableHead>
                    <TableHead>分拣类别</TableHead>
                    <TableHead>同步日期</TableHead>
                    <TableHead className="text-right">管理操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : filteredDocs.length > 0 ? filteredDocs.map((doc) => {
                    const person = persons.find(p => p.PERSONID === doc.PERSONID)
                    return (
                      <TableRow key={doc.ID} className="text-xs">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="truncate max-w-[180px]" title={doc.FILENAME}>{doc.FILENAME}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/patients/${doc.PERSONID}`} className="hover:underline text-primary font-bold">
                            {person?.PERSONNAME || '未知患者'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px]">
                            {doc.TYPE === 'IMAGING' ? '影像报告' : doc.TYPE === 'PE_REPORT' ? '体检报告' : '病理报告'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">{doc.UPLOAD_DATE}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild title="查看病历详情">
                              <Link href={`/patients/${doc.PERSONID}`}>
                                <Eye className="h-4 w-4 text-primary" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)} title="另存为">
                              <Download className="h-4 w-4 text-secondary" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)} title="彻底销毁">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">中心库暂无符合筛选条件的报告流水</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
