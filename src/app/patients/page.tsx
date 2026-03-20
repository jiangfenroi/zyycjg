"use client"

import * as React from 'react'
import { Search, Plus, FileUp, MoreVertical, Eye, Loader2, RefreshCw } from 'lucide-react'
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
  const [submitting, setSubmitting] = React.useState(false)

  const [formData, setFormData] = React.useState<Partial<Person>>({
    PERSONID: '',
    PERSONNAME: '',
    SEX: '男',
    AGE: 0,
    PHONE: '',
    UNITNAME: '',
    OCCURDATE: '',
  })

  const fetchData = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await DataService.getPatients()
      setPersons(data)
    } catch (err: any) {
      toast({ variant: "destructive", title: "同步失败", description: "无法连接中心库" })
    } finally {
      if (!silent) setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchData()
    setFormData(prev => ({
      ...prev,
      PERSONID: `D${Date.now().toString().slice(-8)}`,
      OCCURDATE: new Date().toISOString().split('T')[0]
    }))
  }, [fetchData])

  const filteredPersons = React.useMemo(() => {
    const s = searchTerm.toLowerCase();
    return persons.filter(p => 
      p.PERSONNAME.includes(s) || 
      p.PERSONID.includes(s) ||
      p.PHONE.includes(s)
    )
  }, [persons, searchTerm])

  const handleAddPatient = async () => {
    if (!formData.PERSONNAME || !formData.PHONE) {
      toast({ variant: "destructive", title: "校验失败", description: "基本资料不全" })
      return
    }

    setSubmitting(true)
    try {
      const storedUser = localStorage.getItem('currentUser');
      const optName = storedUser ? JSON.parse(storedUser).REAL_NAME : '管理员';
      const newPerson: Person = { ...formData as Person, OPTNAME: optName };
      const success = await DataService.addPatient(newPerson);
      
      if (success) {
        toast({ title: "建档成功" });
        setIsAddDialogOpen(false);
        fetchData(true);
        setFormData({
          PERSONID: `D${Date.now().toString().slice(-8)}`,
          PERSONNAME: '',
          SEX: '男',
          AGE: 0,
          PHONE: '',
          UNITNAME: '',
          OCCURDATE: new Date().toISOString().split('T')[0],
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">患者档案管理</h1>
          <p className="text-muted-foreground mt-1">全局档案检索，全生命周期病历追溯</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchData()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> 新增建档</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader><DialogTitle>档案采集</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>档案编号</Label><Input value={formData.PERSONID} readOnly className="bg-muted font-mono" /></div>
                  <div className="space-y-2"><Label>患者姓名</Label><Input value={formData.PERSONNAME} onChange={e => setFormData({...formData, PERSONNAME: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>性别</Label>
                    <Select value={formData.SEX} onValueChange={v => setFormData({...formData, SEX: v as '男' | '女'})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="男">男</SelectItem><SelectItem value="女">女</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>年龄</Label><Input type="number" value={formData.AGE} onChange={e => setFormData({...formData, AGE: parseInt(e.target.value) || 0})} /></div>
                  <div className="space-y-2"><Label>手机号</Label><Input value={formData.PHONE} onChange={e => setFormData({...formData, PHONE: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><Label>单位信息</Label><Input value={formData.UNITNAME} onChange={e => setFormData({...formData, UNITNAME: e.target.value})} /></div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddPatient} disabled={submitting}>确认同步建档</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="姓名、编号检索..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
              {loading && persons.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : filteredPersons.length > 0 ? filteredPersons.map((person) => (
                <TableRow key={person.PERSONID}>
                  <TableCell className="font-mono text-xs">{person.PERSONID}</TableCell>
                  <TableCell className="font-medium">{person.PERSONNAME}</TableCell>
                  <TableCell>{person.SEX}</TableCell>
                  <TableCell>{person.AGE}</TableCell>
                  <TableCell>{person.PHONE}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild><Link href={`/patients/${person.PERSONID}`}><Eye className="h-4 w-4" /></Link></Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">未检索到相关档案</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}