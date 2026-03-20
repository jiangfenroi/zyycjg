
"use client"

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  ExternalLink, 
  FileText, 
  User, 
  Briefcase, 
  Phone,
  Download,
  Upload,
  Activity,
  Loader2,
  Eye,
  Trash2,
  PlusCircle,
  CheckCircle2,
  FileSearch,
  UserMinus,
  UserCheck,
  Heart,
  Calendar
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DataService } from '@/services/data-service'
import { PatientDocument, AbnormalResult, FollowUp, Person } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

const addYears = (dateStr: string, years: number) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().split('T')[0];
};

const addMonths = (dateStr: string, months: number) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
};

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
  const [selectedFilePath, setSelectedFilePath] = React.useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null)
  
  const [isFollowUpOpen, setIsFollowUpOpen] = React.useState(false)
  const [followUpSubmitting, setFollowUpSubmitting] = React.useState(false)
  const [followUpForm, setFollowUpForm] = React.useState({
    HFresult: '',
    SFTIME: '',
    SFSJ: '',
    SFGZRY: '',
    jcsf: false,
    ZYYCJGTJBH: '',
    XCSFTIME: '',
    calculationBase: 'today' as 'today' | 'pedate'
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
        ZYYCJGTJBH: results[0]?.TJBHID || '',
        XCSFTIME: '',
        calculationBase: 'today'
      })
    }
  }, [isFollowUpOpen, results])

  const handleQuickDate = (months: number) => {
    const selectedRes = results.find(r => r.TJBHID === followUpForm.ZYYCJGTJBH);
    if (!selectedRes && followUpForm.calculationBase === 'pedate') return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const baseDate = followUpForm.calculationBase === 'today' 
      ? todayStr 
      : DataService.getPEDateFromID(selectedRes?.TJBHID || '', selectedRes?.ZYYCJGTZRQ || todayStr);
    
    let resultDate = '';
    if (months === 12) {
      resultDate = addYears(baseDate, 1);
    } else {
      resultDate = addMonths(baseDate, months);
    }
    setFollowUpForm(prev => ({ ...prev, XCSFTIME: resultDate }));
  }

  const handleUpdateStatus = async (status: 'alive' | 'deceased' | 'lost') => {
    if (!person) return
    const success = await DataService.addPatient({ ...person, STATUS: status })
    if (success) {
      toast({ title: "状态已同步" })
      loadAllData()
    }
  }

  const handlePACSClose = async () => {
    const url = `http://172.16.201.61:7242/?ChtId=${id}`;
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.openExternal) {
      await window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  }

  if (loading && !person) return <div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
  if (!person) return <div className="p-8 text-center text-muted-foreground">该患者档案不存在于中心库中。</div>

  const handleSelectFile = async () => {
    const file = await DataService.selectLocalFile();
    if (file) {
      setSelectedFilePath(file.path);
      setSelectedFileName(file.name);
    }
  }

  const handleUpload = async () => {
    if (!selectedFilePath) {
      toast({ variant: "destructive", title: "校验失败", description: "请先选择本地 PDF 文件" })
      return
    }
    setUploading(true)
    try {
      const success = await DataService.uploadDocument(selectedFilePath, id, uploadType, uploadDate)
      if (success) {
        toast({ title: "报告同步成功", description: "附件已存储于中心分层目录。" })
        setIsUploadOpen(false)
        setSelectedFilePath(null)
        setSelectedFileName(null)
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
      const selectedRes = results.find(r => r.TJBHID === followUpForm.ZYYCJGTJBH);
      if (selectedRes && followUpForm.XCSFTIME) {
        await DataService.updateNextFollowUpDate(selectedRes.ID, followUpForm.XCSFTIME);
      }

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
        {person.STATUS === 'deceased' && <Badge variant="destructive" className="animate-pulse">已死亡 · 随访计划已停办</Badge>}
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
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold">档案状态管理</Label>
                <Select value={person.STATUS || 'alive'} onValueChange={handleUpdateStatus}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alive" className="text-emerald-600"><div className="flex items-center gap-2"><Heart className="h-3 w-3" /> 正常</div></SelectItem>
                    <SelectItem value="deceased" className="text-destructive"><div className="flex items-center gap-2"><UserMinus className="h-3 w-3" /> 已死亡</div></SelectItem>
                    <SelectItem value="lost" className="text-amber-600"><div className="flex items-center gap-2"><UserCheck className="h-3 w-3" /> 无法联系</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{person.PHONE}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{person.UNITNAME || '无单位登记信息'}</span>
              </div>
            </div>
            <div className="pt-6 border-t flex flex-col gap-2">
              <Button variant="outline" className="w-full justify-start" onClick={handlePACSClose}>
                <ExternalLink className="mr-2 h-4 w-4 text-primary" /> PACS 影像原始查询
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="abnormal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="abnormal">异常登记 ({results.length})</TabsTrigger>
              <TabsTrigger value="followup">随访历史 ({followUps.length})</TabsTrigger>
              <TabsTrigger value="files">报告中心 ({docs.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="abnormal" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>体检流水号</TableHead>
                      <TableHead>风险分类</TableHead>
                      <TableHead>登记日期</TableHead>
                      <TableHead>详情</TableHead>
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
                <Button size="sm" onClick={() => setIsFollowUpOpen(true)} disabled={person.STATUS === 'deceased'}>
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
                      <TableHead>核查</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {followUps.length > 0 ? followUps.map(f => (
                        <TableRow key={f.ID} className="text-xs">
                          <TableCell className="font-mono">{f.ZYYCJGTJBH || '-'}</TableCell>
                          <TableCell className="font-mono">{f.SFTIME}</TableCell>
                          <TableCell className="max-w-[300px] truncate" title={f.HFresult}>{f.HFresult}</TableCell>
                          <TableCell>
                             <Badge variant={f.jcsf ? "default" : "outline"} className="text-[10px]">
                               {f.jcsf ? '已完成' : '未完成'}
                             </Badge>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">暂无随访记录</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="mt-4 space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setIsUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" /> 同步新报告
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {docs.length > 0 ? docs.map(doc => (
                  <Card key={doc.ID} className="flex items-center p-4 gap-4">
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold truncate">{doc.FILENAME}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{doc.UPLOAD_DATE}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewUrl(`app-file://${doc.FILE_URL}`)}>
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteDoc(doc)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                )) : (
                  <div className="col-span-2 text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground text-xs">暂无关联附件报告。</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isFollowUpOpen} onOpenChange={setIsFollowUpOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>登记随访结案 - {person.PERSONNAME}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="space-y-2">
              <Label>关联体检流水号</Label>
              <Select value={followUpForm.ZYYCJGTJBH} onValueChange={v => setFollowUpForm({...followUpForm, ZYYCJGTJBH: v})}>
                <SelectTrigger><SelectValue placeholder="选择流水" /></SelectTrigger>
                <SelectContent>
                  {results.map(r => (
                    <SelectItem key={r.ID} value={r.TJBHID || ''}>{r.TJBHID}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>回访结论详情</Label>
              <Textarea value={followUpForm.HFresult} onChange={e => setFollowUpForm({...followUpForm, HFresult: e.target.value})} placeholder="记录沟通结果..." className="min-h-[80px]" />
            </div>

            <div className="grid grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/10">
               <div className="space-y-3">
                 <Label className="font-bold text-xs flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> 下次随访预定</Label>
                 <Input type="date" value={followUpForm.XCSFTIME} onChange={e => setFollowUpForm({...followUpForm, XCSFTIME: e.target.value})} />
                 <div className="flex flex-col gap-2">
                    <Label className="text-[10px] text-muted-foreground font-bold">计算基准</Label>
                    <RadioGroup value={followUpForm.calculationBase} onValueChange={v => setFollowUpForm({...followUpForm, calculationBase: v as any})} className="flex gap-4">
                       <div className="flex items-center space-x-2"><RadioGroupItem value="today" id="detail-base-today" /><Label htmlFor="detail-base-today" className="text-[10px]">当天</Label></div>
                       <div className="flex items-center space-x-2"><RadioGroupItem value="pedate" id="detail-base-pe" /><Label htmlFor="detail-base-pe" className="text-[10px]">体检日</Label></div>
                    </RadioGroup>
                 </div>
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] text-muted-foreground">快速周期选择</Label>
                 <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => handleQuickDate(1)}>1月后</Button>
                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => handleQuickDate(3)}>3月后</Button>
                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => handleQuickDate(6)}>半年后</Button>
                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => handleQuickDate(12)}>1年后</Button>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>结案日期</Label><Input type="date" value={followUpForm.SFTIME} onChange={e => setFollowUpForm({...followUpForm, SFTIME: e.target.value})} /></div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox id="jcsf_detail" checked={followUpForm.jcsf} onCheckedChange={(v) => setFollowUpForm({...followUpForm, jcsf: !!v})} />
                <Label htmlFor="jcsf_detail">已完成复查</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFollowUpOpen(false)}>取消</Button>
            <Button onClick={handleAddFollowUp} disabled={followUpSubmitting}>
              {followUpSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              确认提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
