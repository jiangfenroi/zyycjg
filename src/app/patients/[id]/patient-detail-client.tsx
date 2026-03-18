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
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataService } from '@/services/data-service'
import { PatientDocument, AbnormalResult, FollowUp, Person } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface PatientDetailClientProps {
  id: string
}

export function PatientDetailClient({ id }: PatientDetailClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [person, setPerson] = React.useState<Person | null>(null)
  const [results, setResults] = React.useState<AbnormalResult[]>([])
  const [followUps, setFollowUps] = React.useState<FollowUp[]>([])
  const [docs, setDocs] = React.useState<PatientDocument[]>([])
  const [loading, setLoading] = React.useState(true)
  
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [uploadType, setUploadType] = React.useState<'PE_REPORT' | 'IMAGING' | 'PATHOLOGY'>('PE_REPORT')
  const [uploading, setUploading] = React.useState(false)
  
  // PDF 预览状态
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
  }, [loadAllData])

  if (loading && !person) return <div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
  if (!person) return <div className="p-8 text-center text-muted-foreground">患者档案不存在</div>

  const openPACS = () => {
    if (typeof window !== 'undefined') {
      window.open(`http://172.16.201.61:7242/?ChtId=${id}`, '_blank')
    }
  }

  const handleUpload = async () => {
    setUploading(true)
    try {
      const success = await DataService.uploadDocument(id, uploadType)
      if (success) {
        toast({ title: "上传成功", description: "报告附件已保存至中心存储并关联至病历。" })
        setIsUploadOpen(false)
        loadAllData()
      } else {
        toast({ variant: "destructive", title: "上传取消", description: "未选择文件或数据库写入失败。" })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "系统错误", description: "上传过程中出现异常。" })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-primary">患者病历档案</h1>
        <Badge variant="outline" className="bg-white">{id}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit shadow-md">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
              <User className="h-10 w-10 text-primary" />
            </div>
            <CardTitle>{person.PERSONNAME}</CardTitle>
            <CardDescription>{person.SEX} · {person.AGE}岁</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{person.PHONE}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{person.UNITNAME || '无单位信息'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground italic">网络版中心地址同步</span>
              </div>
            </div>
            <div className="pt-4 border-t flex flex-col gap-2">
              <Button variant="outline" className="w-full justify-start" onClick={openPACS}>
                <ExternalLink className="mr-2 h-4 w-4" /> 查看中心PACS影像
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5">
                <Activity className="mr-2 h-4 w-4" /> 查看临床预警历史
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="abnormal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="abnormal">重要异常结果</TabsTrigger>
              <TabsTrigger value="followup">随访记录</TabsTrigger>
              <TabsTrigger value="files">报告附件</TabsTrigger>
            </TabsList>
            
            <TabsContent value="abnormal" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">登记结果历史</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>体检编号</TableHead>
                        <TableHead>日期</TableHead>
                        <TableHead>分类</TableHead>
                        <TableHead>详情描述</TableHead>
                        <TableHead>通知人</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.length > 0 ? results.map(r => (
                        <TableRow key={r.ID}>
                          <TableCell className="font-mono text-xs">{r.TJBHID}</TableCell>
                          <TableCell className="text-xs">{r.ZYYCJGTZRQ}</TableCell>
                          <TableCell>
                            <Badge variant={r.ZYYCJGFL === 'A' ? 'destructive' : 'secondary'}>{r.ZYYCJGFL}类</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={r.ZYYCJGXQ}>{r.ZYYCJGXQ}</TableCell>
                          <TableCell className="text-xs">{r.WORKER}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 opacity-50">暂无登记记录</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="followup" className="mt-4">
               <Card>
                <CardHeader>
                  <CardTitle className="text-base">历史随访记录</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>日期</TableHead>
                        <TableHead>结果摘要</TableHead>
                        <TableHead>随访人员</TableHead>
                        <TableHead>复查情况</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {followUps.length > 0 ? followUps.map(f => (
                        <TableRow key={f.ID}>
                          <TableCell className="text-xs">{f.SFTIME}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate" title={f.HFresult}>{f.HFresult}</TableCell>
                          <TableCell className="text-xs">{f.SFGZRY}</TableCell>
                          <TableCell className="text-xs">{f.jcsf ? '已复查' : '未复查'}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={4} className="text-center py-8 opacity-50">暂无历史随访记录</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="mt-4 space-y-4">
              <div className="flex justify-end">
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Upload className="mr-2 h-4 w-4" /> 上传新报告
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>上传病历附件 - {person.PERSONNAME}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-2">
                        <Label>报告分类</Label>
                        <Select value={uploadType} onValueChange={v => setUploadType(v as any)}>
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
                      <p className="text-xs text-muted-foreground">支持 PDF 格式。文件将自动同步至中心网络路径并在数据库中登记。</p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsUploadOpen(false)}>取消</Button>
                      <Button onClick={handleUpload} disabled={uploading}>
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "选择并上传"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {docs.length > 0 ? docs.map(doc => (
                  <Card key={doc.ID} className="flex items-center p-4 gap-4 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{doc.FILENAME}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.TYPE === 'IMAGING' ? '影像报告' : doc.TYPE === 'PE_REPORT' ? '体检汇总' : '病理报告'} · {doc.UPLOAD_DATE}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewUrl(doc.FILE_URL)}>
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: "即将通过本地程序打开文件" })}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                )) : (
                  <div className="col-span-2 text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20">
                    暂无关联的 PDF 报告。
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* PDF 预览弹窗 */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <h3 className="font-semibold text-primary">中心库 PDF 在线预览</h3>
            <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>关闭预览</Button>
          </div>
          <div className="flex-1 w-full h-full bg-slate-100 overflow-hidden">
             {previewUrl && (
               <iframe 
                src={`${previewUrl}#toolbar=0`} 
                className="w-full h-full border-none"
                title="PDF Preview"
               />
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
