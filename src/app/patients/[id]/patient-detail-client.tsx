
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
  Trash2,
  PlusCircle,
  CheckCircle2
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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
  
  const [isFollowUpOpen, setIsFollowUpOpen] = React.useState(false)
  const [followUpSubmitting, setFollowUpSubmitting] = React.useState(false)
  const [followUpForm, setFollowUpForm] = React.useState({
    HFresult: '',
    SFTIME: '',
    SFSJ: '',
    SFGZRY: '',
    jcsf: false,
    ZYYCJGTJBH: ''
  })
  
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

  React.useEffect(() => {
    if (isFollowUpOpen) {
      const storedUser = localStorage.getItem('currentUser');
      const realName = storedUser ? JSON.parse(storedUser).REAL_NAME : '操作员';
      setFollowUpForm({
        HFresult: '',
        SFTIME: new Date().toISOString().split('T')[0],
        SFSJ: new Date().toTimeString().slice(0, 5),
        SFGZRY: realName,
        jcsf: false,
        ZYYCJGTJBH: results[0]?.TJBHID || ''
      })
    }
  }, [isFollowUpOpen, results])

  if (loading && !person) return <div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
  if (!person) return <div className="p-8 text-center text-muted-foreground">该患者档案不存在于中心库中。</div>

  const handleUpload = async () => {
    setUploading(true)
    try {
      const success = await DataService.uploadDocument(id, uploadType, uploadDate)
      if (success) {
        toast({ title: "报告同步成功", description: "附件已存储于中心分层目录。" })
        setIsUploadOpen(false)
        loadAllData()
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "物理同步失败", description: err.message })
    } finally {
      setUploading(false)
    }
  }

  const handleAddFollowUp = async () => {
    if (!followUpForm.HFresult) {
      toast({ variant: "destructive", title: "校验失败", description: "请填写回访结论" })
      return
    }
    setFollowUpSubmitting(true)
    try {
      const success = await DataService.addFollowUp({
        ID: `F${Date.now()}`,
        PERSONID: id,
        ...followUpForm
      } as FollowUp)
      if (success) {
        toast({ title: "随访结案成功" })
        setIsFollowUpOpen(false)
        loadAllData()
      }
    } finally {
      setFollowUpSubmitting(false)
    }
  }

  const handleDownload = async (doc: PatientDocument) => {
    const success = await DataService.downloadDocument(doc.FILE_URL, doc.FILENAME);
    if (success) toast({ title: "导出成功" });
  }

  const handleDeleteDoc = async (doc: PatientDocument) => {
    if (!confirm(`确定要永久删除报告 ${doc.FILENAME} 吗？`)) return;
    const success = await DataService.deleteDocument(doc.ID, doc.FILE_URL);
    if (success) {
      toast({ title: "附件已移除" });
      loadAllData();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-primary">全院电子病历档案</h1>
        <Badge variant="outline" className="bg-white font-mono">{id}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit shadow-md border-t-4 border-t-primary">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
              <User className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl">{person.PERSONNAME}</CardTitle>
            <CardDescription>{person.SEX} · {person.AGE}岁</CardDescription>
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
              <div className="flex items-center gap-3 text-sm font-mono text-[10px] text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>建档: {person.OCCURDATE}</span>
              </div>
            </div>
            <div className="pt-6 border-t flex flex-col gap-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => window.open(`http://172.16.201.61:7242/?ChtId=${id}`, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4 text-primary" /> PACS 医学影像原始查询
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="abnormal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="abnormal">重要异常结果 {results.length}</TabsTrigger>
              <TabsTrigger value="followup">随访闭环历史 {followUps.length}</TabsTrigger>
              <TabsTrigger value="files">电子报告中心 {docs.length}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="abnormal" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>体检流水号</TableHead>
                      <TableHead>风险分类</TableHead>
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
                        <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">暂无历史异常结果登记</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="followup" className="mt-4 space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setIsFollowUpOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> 登记随访结案
                </Button>
              </div>
               <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>关联体检号</TableHead>
                      <TableHead>结案日期</TableHead>
                      <TableHead>回访结论摘要</TableHead>
                      <TableHead>核查情况</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {followUps.length > 0 ? followUps.map(f => (
                        <TableRow key={f.ID} className="text-xs">
                          <TableCell className="font-mono">{f.ZYYCJGTJBH || '-'}</TableCell>
                          <TableCell className="font-mono">{f.SFTIME}</TableCell>
                          <TableCell className="max-w-[300px] truncate" title={f.HFresult}>{f.HFresult}</TableCell>
                          <TableCell>
                             <Badge variant={f.jcsf ? "default" : "outline"} className="text-[10px]">
                               {f.jcsf ? '已完成复查' : '尚未复查'}
                             </Badge>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">暂无到期随访结案记录</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="mt-4 space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setIsUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" /> 物理同步新报告
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {docs.length > 0 ? docs.map(doc => (
                  <Card key={doc.ID} className="flex items-center p-4 gap-4 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold truncate" title={doc.FILENAME}>{doc.FILENAME}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{doc.UPLOAD_DATE} · {doc.TYPE === 'IMAGING' ? '医学影像' : doc.TYPE === 'PATHOLOGY' ? '病理报告' : '体检报告'}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewUrl(`app-file://${doc.FILE_URL}`)}>
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4 text-secondary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5" onClick={() => handleDeleteDoc(doc)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                )) : (
                  <div className="col-span-2 text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground text-xs">中心库暂无关联附件报告。</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>同步病历报告至中心库 - {person.PERSONNAME}</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4 text-sm">
            <div className="space-y-2">
              <Label>检查/汇总日期</Label>
              <Input type="date" value={uploadDate} onChange={e => setUploadDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>报告分类</Label>
              <Select value={uploadType} onValueChange={v => setUploadType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PE_REPORT">体检报告</SelectItem>
                  <SelectItem value="IMAGING">医学影像报告</SelectItem>
                  <SelectItem value="PATHOLOGY">临床病理组织报告</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>取消</Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "同步上传"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFollowUpOpen} onOpenChange={setIsFollowUpOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>登记随访闭环 - {person.PERSONNAME}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="space-y-2">
              <Label>关联体检流水号</Label>
              <Select value={followUpForm.ZYYCJGTJBH} onValueChange={v => setFollowUpForm({...followUpForm, ZYYCJGTJBH: v})}>
                <SelectTrigger><SelectValue placeholder="选择对应的体检流水" /></SelectTrigger>
                <SelectContent>
                  {results.map(r => (
                    <SelectItem key={r.ID} value={r.TJBHID || ''}>{r.TJBHID} ({r.ZYYCJGFL}类)</SelectItem>
                  ))}
                  {results.length === 0 && <SelectItem value="NONE">无关联异常登记</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>回访结论详情</Label>
              <Textarea value={followUpForm.HFresult} onChange={e => setFollowUpForm({...followUpForm, HFresult: e.target.value})} placeholder="记录沟通结果..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>结案日期</Label><Input type="date" value={followUpForm.SFTIME} onChange={e => setFollowUpForm({...followUpForm, SFTIME: e.target.value})} /></div>
              <div className="space-y-2"><Label>经办人</Label><Input value={followUpForm.SFGZRY} readOnly className="bg-muted" /></div>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-blue-50/50 rounded">
                <Checkbox id="jcsf_detail" checked={followUpForm.jcsf} onCheckedChange={(v) => setFollowUpForm({...followUpForm, jcsf: !!v})} />
                <Label htmlFor="jcsf_detail">已完成必要的复查</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFollowUpOpen(false)}>取消</Button>
            <Button onClick={handleAddFollowUp} disabled={followUpSubmitting}>
              {followUpSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              确认提交结案
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <h3 className="font-bold text-primary text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              全院共享中心存储库 PDF 在线预览
            </h3>
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
