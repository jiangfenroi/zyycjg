"use client"

import * as React from 'react'
import { FileText, Search, Upload, Download, Eye, Trash2, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { MOCK_DOCS, MOCK_PERSONS } from '@/lib/mock-store'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function ReportsPage() {
  const { toast } = useToast()
  const [filterType, setFilterType] = React.useState('all')
  const [searchTerm, setSearchTerm] = React.useState('')

  const filteredDocs = MOCK_DOCS.filter(doc => {
    const matchesType = filterType === 'all' || doc.TYPE === filterType;
    const person = MOCK_PERSONS.find(p => p.PERSONID === doc.PERSONID);
    const matchesSearch = doc.FILENAME.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          person?.PERSONNAME.includes(searchTerm) ||
                          doc.PERSONID.includes(searchTerm);
    return matchesType && matchesSearch;
  });

  const handleUpload = () => {
    toast({
      title: "开始上传",
      description: "请选择体检报告或影像附件进行入库。",
    })
  }

  const handleDownload = (filename: string) => {
    toast({
      title: "下载准备中",
      description: `正在从服务器提取 ${filename}...`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">报告附件管理</h1>
          <p className="text-muted-foreground mt-1">管理 SP_DOCUMENTS 中的关联电子文档与影像扫描件。</p>
        </div>
        <Button onClick={handleUpload}>
          <Upload className="mr-2 h-4 w-4" /> 上传报告
        </Button>
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
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="PE_REPORT">体检报告汇总 (PDF)</SelectItem>
                  <SelectItem value="IMAGING">影像检查结果 (DICOM)</SelectItem>
                  <SelectItem value="PATHOLOGY">病理组织报告</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">关键字搜索</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="文件名、患者名..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="pt-2">
              <Button className="w-full" variant="secondary" onClick={() => { setSearchTerm(''); setFilterType('all'); }}>
                清除筛选条件
              </Button>
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
                    <TableHead className="text-right">交互操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocs.length > 0 ? filteredDocs.map((doc) => {
                    const person = MOCK_PERSONS.find(p => p.PERSONID === doc.PERSONID)
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
                            {doc.TYPE === 'IMAGING' ? '影像报告' : '体检汇总'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{doc.UPLOAD_DATE}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" title="预览" onClick={() => toast({ title: "正在打开预览器..." })}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="下载" onClick={() => handleDownload(doc.FILENAME)}><Download className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => toast({ title: "文件已标记删除", variant: "destructive" })}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-muted-foreground opacity-50">
                        未搜索到相关附件。
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
