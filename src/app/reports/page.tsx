"use client"

import * as React from 'react'
import { FileText, Search, Upload, Download, Eye, Trash2, Loader2, User, FileSearch, RefreshCw } from 'lucide-react'
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

  const loadData = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const [d, p] = await Promise.all([
      DataService.getDocuments(),
      DataService.getPatients()
    ])
    setDocs(d)
    setPersons(p)
    if (!silent) setLoading(false)
  }, [])

  React.useEffect(() => {
    loadData()
    setUploadForm(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }))
  }, [loadData])

  const filteredDocs = React.useMemo(() => docs.filter(doc => {
    const matchesType = filterType === 'all' || doc.TYPE === filterType;
    const person = persons.find(p => p.PERSONID === doc.PERSONID);
    const s = searchTerm.toLowerCase();
    const matchesSearch = doc.FILENAME.toLowerCase().includes(s) || 
                          (person?.PERSONNAME || '').includes(searchTerm) ||
                          doc.PERSONID.includes(s);
    return matchesType && matchesSearch;
  }), [docs, filterType, persons, searchTerm]);

  const filteredPatients = React.useMemo(() => persons.filter(p => 
    p.PERSONNAME.includes(patientSearch) || p.PERSONID.includes(patientSearch)
  ).slice(0, 10), [persons, patientSearch]);

  const handleSelectFile = async () => {
    const file = await DataService.selectLocalFile();
    if (file) {
      setSelectedFilePath(file.path);
      setSelectedFileName(file.name);
    }
  }

  const handleUploadClick = async () => {
    if (!uploadForm.personId || !selectedFilePath) {
      toast({ variant: "destructive", title: "失败", description: "关联档案及文件不能为空" })
      return
    }

    setSubmitting(true)
    try {
      const success = await DataService.uploadDocument(selectedFilePath, uploadForm.personId, uploadForm.type, uploadForm.date)
      if (success) {
        toast({ title: "同步成功" })
        setIsUploadDialogOpen(false)
        loadData(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (doc: PatientDocument) => {
    if (!confirm('确定彻底移除此附件？')) return;
    const success = await DataService.deleteDocument(doc.ID, doc.FILE_URL);
    if (success) {
      toast({ title: "已移除" });
      loadData(true);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">全院报告中心</h1>
          <p className="text-muted-foreground mt-1">物理分层存储库索引。</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => loadData()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild><Button><Upload className="mr-2 h-4 w-4" /> 同步新报告</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>同步 PDF 附件</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4 text-sm">
                <div className="space-y-2">
                  <Label>1. 选取文件</Label>
                  <Button variant="outline" onClick={handleSelectFile} className="w-full h-10">{selectedFileName || "浏览本地文件..."}</Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>日期</Label><Input type="date" value={uploadForm.date} onChange={e => setUploadForm({...uploadForm, date: e.target.value})} /></div>
                  <div className="space-y-1">
                    <Label>分类</Label>
                    <Select value={uploadForm.type} onValueChange={v => setUploadForm({...uploadForm, type: v as any})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PE_REPORT">体检报告</SelectItem>
                        <SelectItem value="IMAGING">影像报告</SelectItem>
                        <SelectItem value="PATHOLOGY">病理报告</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>2. 关联档案</Label>
                  <Input placeholder="输入姓名、编号查询..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                  <ScrollArea className="h-[120px] border rounded p-2 mt-2">
                    {filteredPatients.map(p => (
                      <div key={p.PERSONID} onClick={() => setUploadForm({...uploadForm, personId: p.PERSONID})} className={`p-2 rounded cursor-pointer text-xs mb-1 ${uploadForm.personId === p.PERSONID ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                        {p.PERSONNAME} ({p.PERSONID})
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleUploadClick} disabled={submitting || !uploadForm.personId}>确认上传同步</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1 h-fit">
          <CardHeader><CardTitle className="text-base">检索面板</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">分拣类别</label>
              <Select defaultValue="all" onValueChange={setFilterType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="PE_REPORT">体检</SelectItem>
                  <SelectItem value="IMAGING">影像</SelectItem>
                  <SelectItem value="PATHOLOGY">病理</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">关键词</label>
              <Input placeholder="姓名、编号..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardContent className="p-0">
             <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>文件名</TableHead>
                    <TableHead>关联患者</TableHead>
                    <TableHead>类别</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && docs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : filteredDocs.length > 0 ? filteredDocs.map((doc) => {
                    const person = persons.find(p => p.PERSONID === doc.PERSONID)
                    return (
                      <TableRow key={doc.ID} className="text-xs">
                        <TableCell className="font-medium max-w-[180px] truncate" title={doc.FILENAME}>{doc.FILENAME}</TableCell>
                        <TableCell><Link href={`/patients/${doc.PERSONID}`} className="hover:underline text-primary font-bold">{person?.PERSONNAME || '未知'}</Link></TableCell>
                        <TableCell><Badge variant="outline" className="text-[9px]">{doc.TYPE}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{doc.UPLOAD_DATE}</TableCell>
                        <TableCell className="text-right flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild><Link href={`/patients/${doc.PERSONID}`}><Eye className="h-4" /></Link></Button>
                          <Button variant="ghost" size="icon" onClick={() => DataService.downloadDocument(doc.FILE_URL, doc.FILENAME)}><Download className="h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(doc)}><Trash2 className="h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">无匹配报告索引</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}