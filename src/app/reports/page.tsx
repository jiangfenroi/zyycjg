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

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">报告文件管理</h1>
          <p className="text-muted-foreground mt-1">上传及查看体检报告、检查结果及病理文件。</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" /> 上传文件
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">文件筛选</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">文件类型</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="PE_REPORT">体检报告文件</SelectItem>
                  <SelectItem value="IMAGING">检查结果 (CT/MRI等)</SelectItem>
                  <SelectItem value="PATHOLOGY">病理结果文件</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">搜索患者</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="姓名或ID..." className="pl-8" />
              </div>
            </div>
            <Button className="w-full">
              <Filter className="mr-2 h-4 w-4" /> 应用筛选
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">文件列表</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>文件名</TableHead>
                    <TableHead>所属患者</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>上传时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_DOCS.map((doc) => {
                    const person = MOCK_PERSONS.find(p => p.PERSONID === doc.PERSONID)
                    return (
                      <TableRow key={doc.ID}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {doc.FILENAME}
                          </div>
                        </TableCell>
                        <TableCell>{person?.PERSONNAME} ({doc.PERSONID})</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {doc.TYPE === 'IMAGING' ? '检查结果' : '体检报告'}
                          </Badge>
                        </TableCell>
                        <TableCell>{doc.UPLOAD_DATE}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" title="查看"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="下载"><Download className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
