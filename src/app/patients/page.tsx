"use client"

import * as React from 'react'
import { Search, Plus, Filter, FileUp, MoreVertical, Eye, Edit } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MOCK_PERSONS } from '@/lib/mock-store'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function PatientsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [persons, setPersons] = React.useState(MOCK_PERSONS)

  // 实现实时搜索
  const filteredPersons = persons.filter(p => 
    p.PERSONNAME.includes(searchTerm) || 
    p.PERSONID.includes(searchTerm) ||
    p.PHONE.includes(searchTerm)
  )

  const handleImport = () => {
    toast({
      title: "批量导入",
      description: "SP_PERSON 数据库增量更新功能正常，请上传 CSV 文件。",
    })
  }

  const handleReset = () => {
    setSearchTerm('')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">患者档案管理</h1>
          <p className="text-muted-foreground mt-1">SP_PERSON 全局档案检索与管理系统。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <FileUp className="mr-2 h-4 w-4" /> 批量导入
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> 新增建档
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="搜索姓名、档案编号、手机号..." 
                className="pl-8" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleReset}>重置</Button>
              <Button onClick={() => toast({ title: "查询成功", description: `找到 ${filteredPersons.length} 条符合条件的结果。` })}>查询</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>档案编号</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>性别</TableHead>
                <TableHead>年龄</TableHead>
                <TableHead>单位信息</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>录入日期</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersons.length > 0 ? filteredPersons.map((person) => (
                <TableRow key={person.PERSONID}>
                  <TableCell className="font-mono text-sm">{person.PERSONID}</TableCell>
                  <TableCell className="font-medium">{person.PERSONNAME}</TableCell>
                  <TableCell>{person.SEX}</TableCell>
                  <TableCell>{person.AGE}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{person.UNITNAME || '-'}</TableCell>
                  <TableCell>{person.PHONE}</TableCell>
                  <TableCell className="text-xs">{person.OCCURDATE}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/patients/${person.PERSONID}`}>
                            <Eye className="mr-2 h-4 w-4" /> 查看病历
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" /> 修改资料
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    未检索到匹配的患者档案。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
