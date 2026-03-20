
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
  Calendar,
  Clock,
  AlertCircle,
  ClipboardCheck,
  ChevronRight,
  FilePlus2,
  Paperclip
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { DataService } from '@/services/data-service'
import { PatientDocument, AbnormalResult, FollowUp, Person } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

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

  // 构造统一时间轴数据
  const timelineData = React.useMemo(() => {
    const events: any[] = []
    
    results.forEach(r => {
      events.push({
        id: `res-${r.ID}`,
        type: 'RESULT',
        date: r.ZYYCJGTZRQ,
        title: '异常结果登记',
        data: r
      })
    })

    followUps.forEach(f => {
      events.push({
        id: `sf-${f.ID}`,
        type: 'FOLLOWUP',
        date: f.SFTIME,
        title: '随访结案登记',
        data: f
      })
    })

    return events.sort((a, b) => b.date.localeCompare(a.date))
  }, [results, followUps])

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

  const handleDeleteDoc = async (docId: string, filePath: string) => {
    if (!confirm(`确定要永久删除此报告吗？`)) return;
    const success = await DataService.deleteDocument(docId, filePath);
    if (success) {
      toast({ title: "附件已移除" });
      loadAllData();
    }
  }

  if (loading && !person) return <div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
  if (!person) return <div className="p-8 text-center text-muted-foreground">该患者档案不存在于中心库中。</div>

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
              全院电子病历档案
              <Badge variant="outline" className="font-mono text-[10px] bg-white">{id}</Badge>
            </h1>
            <p className="text-xs text-muted-foreground">中心化数据分拣轨迹 · 临床闭环流水线</p>
          </div>
        </div>
        <div className="flex gap-2">
          {person.STATUS === 'deceased' && <Badge variant="destructive" className="animate-pulse flex items-center gap-1.5"><UserMinus className="h-3 w-3" /> 已死亡 · 随访计划已停办</Badge>}
          <Button size="sm" onClick={() => setIsFollowUpOpen(true)} disabled={person.STATUS === 'deceased'}>
             <PlusCircle className="mr-2 h-4 w-4" /> 登记随访结案
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsUploadOpen(true)}>
             <Upload className="mr-2 h-4 w-4" /> 同步新报告
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4 lg:grid-cols-5">
        {/* 左侧核心档案卡 */}
        <div className="md:col-span-1 lg:col-span-1 space-y-4">
          <Card className="shadow-md border-t-4 border-t-primary sticky top-6">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-primary/10 group overflow-hidden transition-all">
                <User className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <CardTitle className="text-xl font-bold">{person.PERSONNAME}</CardTitle>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                 <Badge variant="secondary" className="text-[10px]">{person.SEX}</Badge>
                 <Badge variant="secondary" className="text-[10px]">{person.AGE} 岁</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <div className="space-y-4">
                <div className="p-3 bg-muted/40 rounded-lg space-y-2 border">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">档案生存状态</Label>
                  <Select value={person.STATUS || 'alive'} onValueChange={handleUpdateStatus}>
                    <SelectTrigger className="h-8 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alive" className="text-emerald-600"><div className="flex items-center gap-2"><Heart className="h-3 w-3" /> 正常管理</div></SelectItem>
                      <SelectItem value="deceased" className="text-destructive"><div className="flex items-center gap-2"><UserMinus className="h-3 w-3" /> 已死亡</div></SelectItem>
                      <SelectItem value="lost" className="text-amber-600"><div className="flex items-center gap-2"><UserCheck className="h-3 w-3" /> 无法联系</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 px-1">
                   <div className="flex items-center gap-3 text-xs">
                     <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                     <span className="font-medium">{person.PHONE}</span>
                   </div>
                   <div className="flex items-center gap-3 text-xs">
                     <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                     <span className="text-muted-foreground leading-snug">{person.UNITNAME || '无单位登记信息'}</span>
                   </div>
                   <div className="flex items-center gap-3 text-xs">
                     <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                     <span className="text-[10px] text-muted-foreground italic">最后同步: {person.LAST_UPDATE ? new Date(person.LAST_UPDATE).toLocaleString() : '-'}</span>
                   </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <Button variant="outline" className="w-full justify-start h-9 text-xs" onClick={handlePACSClose}>
                  <ExternalLink className="mr-2 h-4 w-4 text-primary" /> PACS 影像原始查询
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧核心时序轨迹 */}
        <div className="md:col-span-3 lg:col-span-4 space-y-6">
           <Tabs defaultValue="timeline" className="w-full">
              <div className="flex items-center justify-between mb-2">
                 <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="timeline" className="text-xs px-6">全量临床轨迹 ({timelineData.length})</TabsTrigger>
                    <TabsTrigger value="documents" className="text-xs px-6">报告中心 ({docs.length})</TabsTrigger>
                 </TabsList>
                 <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <Clock className="h-3 w-3" /> 默认按发生时间倒序
                 </div>
              </div>

              <TabsContent value="timeline" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {timelineData.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-primary/20 space-y-8 pb-10">
                    {timelineData.map((event, index) => {
                      const eventDocs = docs.filter(d => d.UPLOAD_DATE === event.date);
                      const isResult = event.type === 'RESULT';
                      
                      return (
                        <div key={event.id} className="relative">
                          {/* 时间轴锚点 */}
                          <div className={cn(
                            "absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-background ring-4 ring-background",
                            isResult ? "bg-primary" : "bg-emerald-500"
                          )} />
                          
                          <div className="flex flex-col gap-3">
                             <div className="flex items-center gap-3">
                                <span className="text-sm font-bold font-mono text-muted-foreground">{event.date}</span>
                                <Badge variant={isResult ? "default" : "outline"} className={cn(
                                  "text-[10px] px-2 h-5",
                                  !isResult && "text-emerald-600 border-emerald-200 bg-emerald-50"
                                )}>
                                   {isResult ? `重要异常: ${event.data.ZYYCJGFL}类` : '随访结案'}
                                </Badge>
                                {isResult && event.data.NEXT_DATE && (
                                  <Badge variant="secondary" className="text-[10px] h-5 font-bold">
                                    <Calendar className="h-2.5 w-2.5 mr-1" /> 下期提醒: {event.data.NEXT_DATE}
                                  </Badge>
                                )}
                             </div>

                             <Card className="hover:shadow-md transition-shadow group">
                                <CardContent className="p-4 space-y-4">
                                   <div className="flex justify-between items-start">
                                      <div className="space-y-1">
                                         <h3 className="text-sm font-bold flex items-center gap-2">
                                            {isResult ? <AlertCircle className="h-4 w-4 text-primary" /> : <ClipboardCheck className="h-4 w-4 text-emerald-500" />}
                                            {isResult ? '重要检查异常发现' : '随访回访结论记录'}
                                         </h3>
                                         <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                            {isResult ? event.data.ZYYCJGXQ : event.data.HFresult}
                                         </p>
                                      </div>
                                      <div className="text-right shrink-0">
                                         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">经办人</p>
                                         <p className="text-xs font-bold text-primary">{isResult ? event.data.WORKER : event.data.SFGZRY}</p>
                                      </div>
                                   </div>

                                   {/* 结果项特有信息 */}
                                   {isResult && (event.data.ZYYCJGCZYJ || event.data.ZYYCJGFKJG) && (
                                      <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                                         {event.data.ZYYCJGCZYJ && (
                                            <div className="space-y-1">
                                               <p className="text-[10px] font-bold text-muted-foreground">医生处置意见</p>
                                               <p className="text-[11px] italic">"{event.data.ZYYCJGCZYJ}"</p>
                                            </div>
                                         )}
                                         {event.data.ZYYCJGFKJG && (
                                            <div className="space-y-1">
                                               <p className="text-[10px] font-bold text-muted-foreground">患者反馈</p>
                                               <p className="text-[11px] italic">"{event.data.ZYYCJGFKJG}"</p>
                                            </div>
                                         )}
                                      </div>
                                   )}

                                   {/* 随访项特有信息 */}
                                   {!isResult && event.data.XCSFTIME && (
                                      <div className="pt-3 border-t">
                                         <div className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-100">
                                            <div className="flex items-center gap-2 text-[10px] text-emerald-700 font-bold">
                                               <Calendar className="h-3 w-3" />
                                               下次随访时间已预定
                                            </div>
                                            <span className="text-xs font-bold text-emerald-700">{event.data.XCSFTIME}</span>
                                         </div>
                                      </div>
                                   )}

                                   {/* 关联报告附件 */}
                                   {eventDocs.length > 0 && (
                                      <div className="pt-4 space-y-2">
                                         <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                                            <Paperclip className="h-3 w-3" /> 当日关联报告附件 ({eventDocs.length})
                                         </div>
                                         <div className="grid gap-2 sm:grid-cols-2">
                                            {eventDocs.map(doc => (
                                               <div key={doc.ID} className="flex items-center justify-between p-2 bg-muted/30 rounded border text-[10px] group/item">
                                                  <div className="flex items-center gap-2 truncate">
                                                     <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                                                     <span className="truncate" title={doc.FILENAME}>{doc.FILENAME}</span>
                                                  </div>
                                                  <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => DataService.downloadDocument(doc.FILE_URL, doc.FILENAME)}>
                                                        <Download className="h-3 w-3" />
                                                     </Button>
                                                     <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteDoc(doc.ID, doc.FILE_URL)}>
                                                        <Trash2 className="h-3 w-3" />
                                                     </Button>
                                                  </div>
                                               </div>
                                            ))}
                                         </div>
                                      </div>
                                   )}
                                </CardContent>
                             </Card>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <Card className="border-dashed py-20 bg-muted/5">
                    <CardContent className="flex flex-col items-center gap-4">
                       <FileSearch className="h-10 w-10 text-muted-foreground opacity-20" />
                       <p className="text-sm text-muted-foreground font-medium italic">暂无该患者的临床轨迹记录。</p>
                       <Button variant="outline" size="sm" onClick={() => setIsFollowUpOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> 立即开启首笔随访</Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="documents" className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {docs.length > 0 ? docs.map(doc => (
                    <Card key={doc.ID} className="flex flex-col p-4 gap-3 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                         <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                            <FileText className="h-6 w-6 text-primary" />
                         </div>
                         <Badge variant="outline" className="text-[9px] uppercase font-bold">{doc.TYPE}</Badge>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold truncate mb-0.5" title={doc.FILENAME}>{doc.FILENAME}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                           <Calendar className="h-2.5 w-2.5" /> {doc.UPLOAD_DATE} 归档
                        </p>
                      </div>
                      <div className="flex gap-2 border-t pt-3">
                        <Button variant="outline" className="flex-1 h-8 text-[10px]" onClick={() => DataService.downloadDocument(doc.FILE_URL, doc.FILENAME)}>
                          <Download className="mr-1.5 h-3 w-3" /> 导出中心库
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteDoc(doc.ID, doc.FILE_URL)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Card>
                  )) : (
                    <div className="col-span-full text-center py-20 border-2 border-dashed rounded-xl bg-muted/5 text-muted-foreground">
                       <FilePlus2 className="h-10 w-10 mx-auto opacity-20 mb-3" />
                       <p className="text-xs">该档案暂无关联电子报告。点击右上方“同步新报告”物理归档。</p>
                    </div>
                  )}
                </div>
              </TabsContent>
           </Tabs>
        </div>
      </div>

      {/* 随访结案弹窗 */}
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
              <Textarea value={followUpForm.HFresult} onChange={e => setFollowUpForm({...followUpForm, HFresult: e.target.value})} placeholder="记录沟通结果及后续诊疗动态..." className="min-h-[100px]" />
            </div>

            <div className="grid grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/10">
               <div className="space-y-3">
                 <Label className="font-bold text-xs flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-primary" /> 下次随访预定</Label>
                 <Input type="date" value={followUpForm.XCSFTIME} onChange={e => setFollowUpForm({...followUpForm, XCSFTIME: e.target.value})} />
                 <div className="flex flex-col gap-2">
                    <Label className="text-[10px] text-muted-foreground font-bold">计算基准日期</Label>
                    <RadioGroup value={followUpForm.calculationBase} onValueChange={v => setFollowUpForm({...followUpForm, calculationBase: v as any})} className="flex gap-4">
                       <div className="flex items-center space-x-2"><RadioGroupItem value="today" id="detail-base-today" /><Label htmlFor="detail-base-today" className="text-[10px]">当天</Label></div>
                       <div className="flex items-center space-x-2"><RadioGroupItem value="pedate" id="detail-base-pe" /><Label htmlFor="detail-base-pe" className="text-[10px]">原始体检日</Label></div>
                    </RadioGroup>
                 </div>
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] text-muted-foreground">快速周期预设</Label>
                 <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => {
                        const baseDate = followUpForm.calculationBase === 'today' ? new Date().toISOString().split('T')[0] : DataService.getPEDateFromID(followUpForm.ZYYCJGTJBH, new Date().toISOString().split('T')[0]);
                        setFollowUpForm({...followUpForm, XCSFTIME: addMonths(baseDate, 1)});
                    }}>1月后</Button>
                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => {
                        const baseDate = followUpForm.calculationBase === 'today' ? new Date().toISOString().split('T')[0] : DataService.getPEDateFromID(followUpForm.ZYYCJGTJBH, new Date().toISOString().split('T')[0]);
                        setFollowUpForm({...followUpForm, XCSFTIME: addMonths(baseDate, 3)});
                    }}>3月后</Button>
                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => {
                        const baseDate = followUpForm.calculationBase === 'today' ? new Date().toISOString().split('T')[0] : DataService.getPEDateFromID(followUpForm.ZYYCJGTJBH, new Date().toISOString().split('T')[0]);
                        setFollowUpForm({...followUpForm, XCSFTIME: addMonths(baseDate, 6)});
                    }}>半年后</Button>
                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => {
                        const baseDate = followUpForm.calculationBase === 'today' ? new Date().toISOString().split('T')[0] : DataService.getPEDateFromID(followUpForm.ZYYCJGTJBH, new Date().toISOString().split('T')[0]);
                        setFollowUpForm({...followUpForm, XCSFTIME: addYears(baseDate, 1)});
                    }}>1年后</Button>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>结案确认日期</Label><Input type="date" value={followUpForm.SFTIME} onChange={e => setFollowUpForm({...followUpForm, SFTIME: e.target.value})} /></div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox id="jcsf_detail" checked={followUpForm.jcsf} onCheckedChange={(v) => setFollowUpForm({...followUpForm, jcsf: !!v})} />
                <Label htmlFor="jcsf_detail">已完成必要的医学复查</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFollowUpOpen(false)}>取消</Button>
            <Button onClick={handleAddFollowUp} disabled={followUpSubmitting} className="font-bold">
              {followUpSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              确认提交结案
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 报告同步弹窗 */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>归档 PDF 电子报告</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="space-y-2">
              <Label>选取物理文件</Label>
              <Button variant="outline" onClick={handleSelectFile} className="w-full h-12 border-dashed border-2 hover:bg-muted/50 transition-colors">
                 {selectedFileName || "浏览本地磁盘文件..."}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <Label>报告产生日期</Label>
                  <Input type="date" value={uploadDate} onChange={e => setUploadDate(e.target.value)} />
               </div>
               <div className="space-y-1">
                  <Label>报告物理分类</Label>
                  <Select value={uploadType} onValueChange={v => setUploadType(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PE_REPORT">体检报告</SelectItem>
                      <SelectItem value="IMAGING">影像报告</SelectItem>
                      <SelectItem value="PATHOLOGY">病理报告</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
            </div>
            <p className="text-[10px] text-muted-foreground bg-blue-50 p-2 rounded border border-blue-100 italic">
               * 物理同步逻辑：文件将自动分拣至中心服务器 <code>[患者ID]/[报告分类]</code> 目录下。
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleUpload} disabled={uploading || !selectedFilePath} className="w-full">
              {uploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
              开始中心化同步
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
