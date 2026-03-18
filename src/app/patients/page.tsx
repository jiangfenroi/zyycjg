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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Person } from '@/lib/types'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { DataService } from '@/services/data-service'

export default function PatientsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [persons, setPersons] = React.useState<Person[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)

  const [formData, setFormData] = React.useState<Partial<Person>>({
    PERSONID: `D${Date.now().toString().slice(-8)}`,
    PERSONNAME: '',
    SEX: '男',
    AGE: 0,
    PHONE: '',
    UNITNAME: '',
    IDNO: '',
    OCCURDATE: new Date().toISOString().split('T')[0],
  })

  // 页面加载时获取数据
  React.useEffect(() => {
    const fetchData = async () => {
      const data = await DataService.getPatients();
      setPersons(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredPersons = persons.filter(p => 
    p.PERSONNAME.includes(searchTerm) || 
    p.PERSONID.includes(searchTerm) ||
    p.PHONE.includes(searchTerm)
  )

  const handleImport = () => {
    toast({ title: "批量导入", description: "正在连接后端数据库接口..." })
  }

  const handleAddPatient = () => {
    if (!formData.PERSONNAME || !formData.PHONE) {
      toast({ variant: "destructive", title: "校验失败", description: "请填写必填字段。" })
      return
    }
    const newPerson: Person = { ...formData as Person, OPTNAME: '管理员' };
    setPersons([newPerson, ...persons]);
    setIsAddDialogOpen(false);
    toast({ title: "建档成功", description: `患者 ${formData.PERSONNAME} 档案已同步至系统。` });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">患者档案管理</h1>
          <p className="text-muted-foreground mt-1">全局档案检索与管理系统。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <FileUp className="mr-2 h-4 w-4" /> 批量导入
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> 新增建档
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>新增患者档案信息</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>档案编号</Label>
                    <Input value={formData.PERSONID} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>患者姓名</Label>
                    <Input value={formData.PERSONNAME} onChange={e => setFormData({...formData, PERSONNAME: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>性别</Label>
                    <Select value={formData.SEX} onValueChange={v => setFormData({...formData, SEX: v as '男' | '女'})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="男">男</SelectItem>
                        <SelectItem value="女">女</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>年龄</Label>
                    <Input type="number" value={formData.AGE} onChange={e => setFormData({...formData, AGE: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>联系电话</Label>
                    <Input value={formData.PHONE} onChange={e => setFormData({...formData, PHONE: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>取消</Button>
                <Button onClick={handleAddPatient}>确认建档</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索姓名、档案编号、手机号..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                <TableHead>联系电话</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">正在连接数据库...</TableCell></TableRow>
              ) : filteredPersons.length > 0 ? filteredPersons.map((person) => (
                <TableRow key={person.PERSONID}>
                  <TableCell className="font-mono text-sm">{person.PERSONID}</TableCell>
                  <TableCell className="font-medium">{person.PERSONNAME}</TableCell>
                  <TableCell>{person.SEX}</TableCell>
                  <TableCell>{person.AGE}</TableCell>
                  <TableCell>{person.PHONE}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/patients/${person.PERSONID}`}><Eye className="mr-2 h-4 w-4" /> 查看病历</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="text-center py-12">未检索到档案。</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
