
"use client"

import * as React from 'react'
import { FileText, Search, Upload, Download, Eye, Trash2, Loader2, User, FileSearch } from 'lucide-react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
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
  const [patientSearch, setPatientSearch] = React.useState('')
  const [selectedFilePath, setSelectedFilePath] = React.useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null)

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

  const filteredPatients = persons.filter(p => 
    p.PERSONNAME.includes(patientSearch) || p.PERSONID.includes(patientSearch)
  ).slice(0, 10);

  const handleSelectFile = async () => {
    const file = await DataService.selectLocalFile();
    if (file) {
      setSelectedFilePath(file.path);
      setSelectedFileName(file.name);
    }
  }

  const handleUploadClick = async () => {
    if (!uploadForm.personId || !selectedFilePath) {
      toast({ variant: "destructive", title: "同步失败", description: "请先关联患者并选择本地文件。" })
      return
    }

    setSubmitting(true)
    try {
      const success = await DataService.uploadDocument(selectedFilePath, uploadForm.personId, uploadForm.type, uploadForm.date)
      if (success) {
        toast({ title: "同步成功", description: "报告已存档并同步至物理中心库。" })
        setIsUploadDialogOpen(false)
        setSelectedFilePath(null)
        setSelectedFileName(null)
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
    if (success) toast({ title: "导出成功" });
  }

  const handleDelete = async (doc: PatientDocument) => {
    if (!confirm(`确定要永久删除报告 ${doc.FILENAME} 吗？`)) return;
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
          <p className="text-muted-foreground mt-1">基于物理中心库的分层文档管理系统。</p>
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" /> 同步新报告
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>物理同步新报告附件</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
              <div className="space-y-2">
                <Label>1. 选择本地 PDF 文件</Label>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSelectFile} className="flex-1 text-xs">
                    <FileSearch className="mr-2 h-4 w-4" /> {selectedFileName || "浏览本地文件..."}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>2. 报告属性</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">报告日期</Label>
                    <Input type="date" value={uploadForm.date} onChange={e => setUploadForm({...uploadForm, date: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">报告分类</Label>
                    <Select value={uploadForm.type} onValueChange={v => setUploadForm({...uploadForm, type: v as any})}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PE_REPORT">体检报告</SelectItem>
                        <SelectItem value="IMAGING">医学影像报告</SelectItem>
                        <SelectItem value="PATHOLOGY">病理组织报告</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>3. 关联患者档案</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="检索姓名或编号..." 
                      className="pl-8" 
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-[120px] border rounded-md p-2">
                    {filteredPatients.length > 0 ? filteredPatients.map(p => (
                      <div 
                        key={p.PERSONID}
                        className={`flex items-center justify-between p-2 rounded-sm cursor-pointer hover:bg-muted text-xs ${uploadForm.personId === p.PERSONID ? 'bg-primary/10 border-primary border' : ''}`}
                        onClick={() => setUploadForm({...uploadForm, personId: p.PERSONID})}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>{p.PERSONNAME}</span>
                        </div>
                        <span className="font-mono text-[10px]">{p.PERSONID}</span>
                      </div>
                    )) : <p className="text-center py-4 text-muted-foreground italic text-xs">无匹配档案</p>}
                  </ScrollArea>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>取消</Button>
              <Button onClick={handleUploadClick} disabled={submitting || !uploadForm.personId || !selectedFilePath}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "同步上传至中心库"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle className="text-base">中心库检索</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">分拣类别</label>
              <Select defaultValue="all" onValueChange={setFilterType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="PE_REPORT">体检报告</SelectItem>
                  <SelectItem value="IMAGING">医学影像</SelectItem>
                  <SelectItem value="PATHOLOGY">临床病理</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">关键字</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="姓名、编号..." className="pl-8 text-xs" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-3 border-b"><CardTitle className="text-base">物理中心库索引列表</CardTitle></CardHeader>
          <CardContent className="p-0">
             <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>文件标题</TableHead>
                    <TableHead>关联患者</TableHead>
                    <TableHead>类别</TableHead>
                    <TableHead>同步日期</TableHead>
                    <TableHead className="text-right">操作</TableHead>
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
                            {person?.PERSONNAME || '未知'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px]">
                            {doc.TYPE === 'IMAGING' ? '影像' : doc.TYPE === 'PE_REPORT' ? '体检' : '病理'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">{doc.UPLOAD_DATE}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild title="查看病历"><Link href={`/patients/${doc.PERSONID}`}><Eye className="h-4 w-4 text-primary" /></Link></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)} title="另存为"><Download className="h-4 w-4 text-secondary" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)} title="销毁"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">暂无报告流水</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
