
"use client"

import * as React from 'react'
import { 
  Download, 
  FileSpreadsheet, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Table as TableIcon,
  RefreshCw,
  SearchCheck,
  ListFilter,
  Layers,
  ShieldAlert
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from '@/hooks/use-toast'
import { DataService } from '@/services/data-service'
import * as XLSX from 'xlsx'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ExportSource = 'PATIENTS' | 'ABNORMAL_RESULTS' | 'FOLLOW_UPS' | 'COMBINED';

interface ColumnOption {
  key: string;
  label: string;
  category: string;
}

const ALL_COLUMNS: ColumnOption[] = [
  // 患者档案
  { key: 'PERSONID', label: '档案编号', category: 'PATIENT' },
  { key: 'PERSONNAME', label: '患者姓名', category: 'PATIENT' },
  { key: 'SEX', label: '性别', category: 'PATIENT' },
  { key: 'AGE', label: '年龄', category: 'PATIENT' },
  { key: 'PHONE', label: '联系电话', category: 'PATIENT' },
  { key: 'IDNO', label: '身份证号', category: 'PATIENT' },
  { key: 'UNITNAME', label: '单位信息', category: 'PATIENT' },
  { key: 'STATUS', label: '生命状态', category: 'PATIENT' },
  // 异常结果
  { key: 'TJBHID', label: '体检流水号', category: 'RESULT' },
  { key: 'ZYYCJGXQ', label: '异常详情摘要', category: 'RESULT' },
  { key: 'ZYYCJGFL', label: '结果分类', category: 'RESULT' },
  { key: 'ZYYCJGCZYJ', label: '医生处置意见', category: 'RESULT' },
  { key: 'ZYYCJGTZRQ', label: '通知日期', category: 'RESULT' },
  { key: 'WORKER', label: '登记经办人', category: 'RESULT' },
  { key: 'ZYYCJGJKXJ', label: '健康宣教标记', category: 'RESULT' },
  { key: 'IS_NOTIFIED', label: '通知状态', category: 'RESULT' },
  // 随访结案
  { key: 'HFresult', label: '随访结论详情', category: 'FOLLOWUP' },
  { key: 'SFTIME', label: '随访结案日期', category: 'FOLLOWUP' },
  { key: 'SFGZRY', label: '随访经办人', category: 'FOLLOWUP' },
  { key: 'jcsf', label: '医学复查标记', category: 'FOLLOWUP' },
  { key: 'XCSFTIME', label: '下期预定日期', category: 'FOLLOWUP' },
];

export default function ExportPage() {
  const { toast } = useToast()
  const [userRole, setUserRole] = React.useState<string | null>(null)
  const [source, setSource] = React.useState<ExportSource>('COMBINED')
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [loadingData, setLoadingData] = React.useState(false)
  const [recordCount, setRecordCount] = React.useState(0)
  
  const [dateRange, setDateRange] = React.useState({
    start: '',
    end: ''
  })

  React.useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      setUserRole(JSON.parse(storedUser).ROLE)
    }
  }, [])

  // 物理读取并计算当前导出模式下的条数
  const refreshStats = React.useCallback(async () => {
    setLoadingData(true);
    try {
      if (source === 'COMBINED') {
        const results = await DataService.getAbnormalResults();
        const filtered = results.filter(r => {
          if (dateRange.start && r.ZYYCJGTZRQ < dateRange.start) return false;
          if (dateRange.end && r.ZYYCJGTZRQ > dateRange.end) return false;
          return true;
        });
        setRecordCount(filtered.length);
      } else {
        let data: any[] = [];
        switch (source) {
          case 'PATIENTS': data = await DataService.getPatients(); break;
          case 'ABNORMAL_RESULTS': data = await DataService.getAbnormalResults(); break;
          case 'FOLLOW_UPS': data = await DataService.getFollowUps(); break;
        }
        const filtered = data.filter(item => {
          const itemDate = item.OCCURDATE || item.ZYYCJGTZRQ || item.SFTIME;
          if (!itemDate) return true;
          if (dateRange.start && itemDate < dateRange.start) return false;
          if (dateRange.end && itemDate > dateRange.end) return false;
          return true;
        });
        setRecordCount(filtered.length);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "数据读取失败", description: "无法从中心库获取统计条数" });
    } finally {
      setLoadingData(false);
    }
  }, [source, dateRange, toast]);

  React.useEffect(() => {
    if (userRole === 'admin') {
      // 默认选中当前模式下的所有可用列
      const available = ALL_COLUMNS.filter(c => {
        if (source === 'COMBINED') return true;
        if (source === 'PATIENTS') return c.category === 'PATIENT';
        if (source === 'ABNORMAL_RESULTS') return c.category === 'PATIENT' || c.category === 'RESULT';
        if (source === 'FOLLOW_UPS') return c.category === 'FOLLOWUP';
        return false;
      }).map(c => c.key);
      setSelectedColumns(available);
      refreshStats();
    }
  }, [source, refreshStats, userRole]);

  if (userRole && userRole !== 'admin') {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive opacity-20" />
        <div className="text-center">
          <h2 className="text-xl font-bold">权限访问受限</h2>
          <p className="text-muted-foreground text-sm mt-1">“数据导出中心”涉及全院敏感信息，仅限管理员账号使用。</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/'}>返回全院工作台</Button>
      </div>
    )
  }

  const handleToggleColumn = (key: string) => {
    setSelectedColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast({ variant: "destructive", title: "导出失败", description: "请至少选择一个导出字段" });
      return;
    }

    setSubmitting(true);
    try {
      let finalData: any[] = [];
      
      if (source === 'COMBINED') {
        const [patients, results, followUps] = await Promise.all([
          DataService.getPatients(),
          DataService.getAbnormalResults(),
          DataService.getFollowUps()
        ]);

        finalData = results
          .filter(r => {
            if (dateRange.start && r.ZYYCJGTZRQ < dateRange.start) return false;
            if (dateRange.end && r.ZYYCJGTZRQ > dateRange.end) return false;
            return true;
          })
          .map(res => {
            const patient = patients.find(p => p.PERSONID === res.PERSONID) || {};
            // 获取该异常结果关联的最新的随访记录
            const latestSF = followUps
              .filter(f => f.PERSONID === res.PERSONID && f.ZYYCJGTJBH === res.TJBHID)
              .sort((a, b) => b.SFTIME.localeCompare(a.SFTIME))[0] || {};
            
            return { ...patient, ...res, ...latestSF };
          });
      } else {
        let rawData: any[] = [];
        switch (source) {
          case 'PATIENTS': rawData = await DataService.getPatients(); break;
          case 'ABNORMAL_RESULTS': rawData = await DataService.getAbnormalResults(); break;
          case 'FOLLOW_UPS': rawData = await DataService.getFollowUps(); break;
        }
        finalData = rawData.filter(item => {
          const itemDate = item.OCCURDATE || item.ZYYCJGTZRQ || item.SFTIME;
          if (!itemDate) return true;
          if (dateRange.start && itemDate < dateRange.start) return false;
          if (dateRange.end && itemDate > dateRange.end) return false;
          return true;
        });
      }

      if (finalData.length === 0) {
        toast({ variant: "destructive", title: "无数据", description: "所选范围内未检索到任何记录" });
        return;
      }

      const exportRows = finalData.map(item => {
        const row: Record<string, any> = {};
        ALL_COLUMNS.forEach(col => {
          if (selectedColumns.includes(col.key)) {
            let val = item[col.key];
            if (col.key === 'jcsf') val = val ? '是' : '否';
            if (col.key === 'ZYYCJGJKXJ') val = val ? '已宣教' : '未宣教';
            if (col.key === 'IS_NOTIFIED') val = val ? '已通知' : '未通知';
            if (col.key === 'STATUS') {
              if (val === 'alive') val = '正常';
              else if (val === 'deceased') val = '已死亡';
              else if (val === 'lost') val = '失访';
            }
            row[col.label] = val === null || val === undefined ? '-' : val;
          }
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "全院临床业务报表");
      
      const fileName = `${source === 'COMBINED' ? '全院业务合表' : '单表导出'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({ title: "导出成功", description: `已成功生成 ${finalData.length} 条业务记录` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "系统错误", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredColumns = () => {
    if (source === 'COMBINED') return ALL_COLUMNS;
    if (source === 'PATIENTS') return ALL_COLUMNS.filter(c => c.category === 'PATIENT');
    if (source === 'ABNORMAL_RESULTS') return ALL_COLUMNS.filter(c => c.category === 'PATIENT' || c.category === 'RESULT');
    if (source === 'FOLLOW_UPS') return ALL_COLUMNS.filter(c => c.category === 'FOLLOWUP');
    return [];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">数据导出中心</h1>
          <p className="text-muted-foreground text-sm mt-1 font-medium">跨表业务归集 · 全院数据合并 · 物理同步引擎</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 border-primary/20 bg-primary/5 text-primary font-bold flex items-center gap-2">
          {loadingData ? <Loader2 className="h-3 w-3 animate-spin" /> : <SearchCheck className="h-3 w-3" />}
          当前模式下就绪: {recordCount} 条
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm border-t-4 border-t-primary">
            <CardHeader className="pb-3 border-b bg-muted/5">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                导出模式与过滤
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">导出逻辑类型</Label>
                <Select value={source} onValueChange={(v: ExportSource) => setSource(v)}>
                  <SelectTrigger className="h-10 font-bold border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMBINED" className="font-bold">全院业务合表 (患者+异常+随访)</SelectItem>
                    <SelectItem value="ABNORMAL_RESULTS">单表：重要异常结果流水</SelectItem>
                    <SelectItem value="FOLLOW_UPS">单表：随访结案流水</SelectItem>
                    <SelectItem value="PATIENTS">单表：全院电子档案</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground bg-primary/5 p-2 rounded leading-relaxed border border-primary/10">
                  {source === 'COMBINED' 
                    ? "合表模式：以每一项『重要异常记录』为中心，自动物理关联其对应的『患者信息』及『随访结论』，合并为一行导出。"
                    : "单表模式：直接物理导出所选数据库表的原始记录。"}
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-muted-foreground">业务日期区间</Label>
                <div className="grid grid-cols-1 gap-3">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
                    <Input type="date" className="pl-9 text-xs" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
                    <Input type="date" className="pl-9 text-xs" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-9 text-xs font-bold" 
                  onClick={refreshStats}
                  disabled={loadingData}
                >
                  <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} />
                  重新计算导出规模
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full h-14 text-base font-bold shadow-lg group" 
            onClick={handleExport}
            disabled={submitting || recordCount === 0}
          >
            {submitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <FileSpreadsheet className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />}
            执行 Excel 物理导出
          </Button>
        </div>

        <Card className="md:col-span-2 shadow-sm border-t-4 border-t-primary">
          <CardHeader className="pb-3 border-b bg-muted/5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-primary" />
                自定义字段勾选 (跨表合并)
              </CardTitle>
              <CardDescription className="text-xs">
                勾选需要合并在同一行导出的临床维度
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedColumns(getFilteredColumns().map(c => c.key))} className="h-8 text-[11px] font-bold">全选字段</Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedColumns([])} className="h-8 text-[11px] font-bold">清空选择</Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 p-0">
            <Tabs defaultValue="PATIENT" className="w-full">
              <TabsList className="w-full rounded-none border-b h-12 bg-muted/30">
                <TabsTrigger value="PATIENT" className="flex-1 text-xs font-bold">1. 档案信息</TabsTrigger>
                {(source === 'COMBINED' || source === 'ABNORMAL_RESULTS') && <TabsTrigger value="RESULT" className="flex-1 text-xs font-bold">2. 异常详情</TabsTrigger>}
                {(source === 'COMBINED' || source === 'FOLLOW_UPS') && <TabsTrigger value="FOLLOWUP" className="flex-1 text-xs font-bold">3. 随访结案</TabsTrigger>}
              </TabsList>
              
              <div className="p-6">
                {['PATIENT', 'RESULT', 'FOLLOWUP'].map(cat => (
                  <TabsContent key={cat} value={cat} className="mt-0">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {ALL_COLUMNS.filter(c => c.category === cat).map((col) => (
                        <div 
                          key={col.key} 
                          className={`flex items-center space-x-3 p-3 border rounded-lg transition-all cursor-pointer group hover:border-primary/50 ${selectedColumns.includes(col.key) ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'bg-background'}`} 
                          onClick={() => handleToggleColumn(col.key)}
                        >
                          <Checkbox 
                            id={`col-${col.key}`} 
                            checked={selectedColumns.includes(col.key)}
                            onCheckedChange={() => handleToggleColumn(col.key)}
                          />
                          <div className="space-y-0.5">
                            <Label htmlFor={`col-${col.key}`} className="text-xs font-bold group-hover:text-primary transition-colors cursor-pointer leading-none">
                              {col.label}
                            </Label>
                            <p className="text-[9px] text-muted-foreground font-mono opacity-60">{col.key}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>

            <div className="mx-6 mb-6 p-8 bg-muted/30 rounded-xl border-2 border-dashed flex flex-col items-center text-center">
               <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center shadow-inner mb-3">
                  <FileSpreadsheet className="h-6 w-6 text-primary opacity-40" />
               </div>
               <h4 className="text-sm font-bold text-foreground">物理合表引擎已就绪</h4>
               <p className="text-[11px] text-muted-foreground mt-2 max-w-sm leading-relaxed">
                 系统将以『档案编号/体检号』为唯一标识，为您选中的 <span className="text-primary font-bold">{selectedColumns.length}</span> 个跨表字段执行物理连接。
               </p>
               <div className="flex gap-4 mt-4">
                  <Badge variant="secondary" className="text-[9px] px-2 py-0.5 font-mono">ID-BASED MERGE</Badge>
                  <Badge variant="secondary" className="text-[9px] px-2 py-0.5 font-mono">ON DUPLICATE: LATEST</Badge>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
