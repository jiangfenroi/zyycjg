
"use client"

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  ExternalLink, 
  FileText, 
  User, 
  MapPin, 
  Briefcase, 
  Phone,
  Download,
  Upload,
  Activity,
  Loader2,
  Eye,
  Calendar as CalendarIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataService } from '@/services/data-service'
import { PatientDocument, AbnormalResult, FollowUp, Person } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

export function PatientDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [person, setPerson] = React.useState<Person | null>(null)
  const [results, setResults] = React.useState<AbnormalResult[]>([])
  const [followUps, setFollowUps] = React.useState<FollowUp[]>([])
  const [docs, setDocs] = React.useState<PatientDocument[]>([])
  const [loading, setLoading] = React.useState(true)
  
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [uploadType, setUploadType] = React.useState<'PE_REPORT' | 'IMAGING' | 'PATHOLOGY'>('PE_REPORT')
  const [uploadDate, setUploadDate] = React.useState('')
  const [uploading, setUploading] = React.useState(false)
  
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  const loadAllData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [allPersons, allResults, allFollowUps, allDocs] = await Promise.all([
        DataService.getPatients(),
        DataService.getAbnormalResults(),
        DataService.getFollowUps(id),
        DataService.getDocuments(id)
      ])
      
      const p = allPersons.find(p => p.PERSONID === id)
      if (p) setPerson(p)
      
      setResults(allResults.filter(r => r.PERSONID === id))
      setFollowUps(allFollowUps)
      setDocs(allDocs)
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    loadAllData()
    setUploadDate(new Date().toISOString().split('T')[0])
  }, [loadAllData])

  if (loading && !person) return <div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
  if (!person) return <div className="p-8 text-center text-muted-foreground">该患者档案不存在。</div>

  const handleUpload = async () => {
    setUploading(true)
    try {
      const success = await DataService.uploadDocument(id, uploadType, uploadDate)
      if (success) {
        toast({ title: "报告上传成功", description: "附件已存档并关联至患者电子病历。" })
        setIsUploadOpen(false)
        loadAllData()
      } else {
        toast({ variant: "destructive", title: "操作取消或失败" })
      }
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (doc: PatientDocument) => {
    const success = await DataService.downloadDocument(doc.FILE_URL, doc.FILENAME);
    if (success) toast({ title: "另存为成功", description: `报告已导出至选定目录。` });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-primary">患者完整病历档案</h1>
        <Badge variant="outline" className="bg-white font-mono">{id}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit shadow-md border-t-4 border-t-primary">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
              <User className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl">{person.PERSONNAME}</CardTitle>
            <CardDescription>{person.SEX} · {person.AGE}岁 · {id.slice(-6)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{person.PHONE}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{person.UNITNAME || '无单位登记信息'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs italic text-muted-foreground">网络版数据中心同步地址</span>
              </div>
            </div>
            <div className="pt-6 border-t flex flex-col gap-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => window.open(`http://172.16.201.61:7242/?ChtId=${id}`, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4 text-primary" /> PACS 中心影像查询
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive/5 border-destructive/20">
                <Activity className="mr-2 h-4 w-4" /> 临床风险预警历史
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="abnormal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="abnormal">异常结果 ({results.length})</TabsTrigger>
              <TabsTrigger value="followup">随访记录 ({followUps.length})</TabsTrigger>
              <TabsTrigger value="files">报告附件 ({docs.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="abnormal" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>体检号</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead>登记日期</TableHead>
                      <TableHead>详情描述</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {results.length > 0 ? results.map(r => (
                        <TableRow key={r.ID} className="text-xs">
                          <TableCell className="font-mono">{r.TJBHID}</TableCell>
                          <TableCell><Badge variant={r.ZYYCJGFL === 'A' ? 'destructive' : 'secondary'}>{r.ZYYCJGFL}类</Badge></TableCell>
                          <TableCell>{r.ZYYCJGTZRQ}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={r.ZYYCJGXQ}>{r.ZYYCJGXQ}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">暂无登记记录</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="followup" className="mt-4">
               <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>体检号</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>结果摘要</TableHead>
                      <TableHead>复查情况</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {followUps.length > 0 ? followUps.map(f => (
                        <TableRow key={f.ID} className="text-xs">
                          <TableCell className="font-mono">{f.ZYYCJGTJBH || '-'}</TableCell>
                          <TableCell className="font-mono">{f.SFTIME}</TableCell>
                          <TableCell className="max-w-[300px] truncate" title={f.HFresult}>{f.HFresult}</TableCell>
                          <TableCell>
                             <Badge variant={f.jcsf ? "default" : "outline"} className="text-[10px]">
                               {f.jcsf ? '已复查' : '未复查'}
                             </Badge>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">暂无历史随访记录</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="mt-4 space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setIsUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" /> 上传新报告
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {docs.length > 0 ? docs.map(doc => (
                  <Card key={doc.ID} className="flex items-center p-4 gap-4 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate" title={doc.FILENAME}>{doc.FILENAME}</p>
                      <p className="text-xs text-muted-foreground">{doc.UPLOAD_DATE} · {doc.TYPE === 'IMAGING' ? '影像' : '体检'}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewUrl(`app-file://${doc.FILE_URL}`)}>
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4 text-secondary" />
                      </Button>
                    </div>
                  </Card>
                )) : (
                  <div className="col-span-2 text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">暂无关联的 PDF 附件。</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>上传病历报告 - {person.PERSONNAME}</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>检查/报告产生日期</Label>
              <Input type="date" value={uploadDate} onChange={e => setUploadDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>报告分类</Label>
              <Select value={uploadType} onValueChange={v => setUploadType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PE_REPORT">年度体检报告汇总</SelectItem>
                  <SelectItem value="IMAGING">医学影像(CT/MRI)报告</SelectItem>
                  <SelectItem value="PATHOLOGY">病理组织学报告</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground bg-blue-50 p-3 rounded border border-blue-100 italic">
              提示：附件将同步至医院中心存储路径。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>取消</Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "选择并上传"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <h3 className="font-semibold text-primary">中心存储库 PDF 在线预览</h3>
            <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>关闭预览</Button>
          </div>
          <div className="flex-1 w-full h-full bg-slate-100 overflow-hidden">
             {previewUrl && <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full border-none" title="PDF Preview" />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
