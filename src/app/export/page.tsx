
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
  ListFilter
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

type ExportSource = 'PATIENTS' | 'ABNORMAL_RESULTS' | 'FOLLOW_UPS';

interface ColumnOption {
  key: string;
  label: string;
}

const COLUMN_MAP: Record<ExportSource, ColumnOption[]> = {
  PATIENTS: [
    { key: 'PERSONID', label: '档案编号' },
    { key: 'PERSONNAME', label: '患者姓名' },
    { key: 'SEX', label: '性别' },
    { key: 'AGE', label: '年龄' },
    { key: 'PHONE', label: '联系电话' },
    { key: 'IDNO', label: '身份证号' },
    { key: 'UNITNAME', label: '单位信息' },
    { key: 'OCCURDATE', label: '建档日期' },
    { key: 'STATUS', label: '生命状态' },
    { key: 'OPTNAME', label: '建档人' },
  ],
  ABNORMAL_RESULTS: [
    { key: 'ID', label: '流水ID' },
    { key: 'PERSONID', label: '档案编号' },
    { key: 'PERSONNAME', label: '患者姓名' },
    { key: 'TJBHID', label: '体检流水号' },
    { key: 'ZYYCJGXQ', label: '异常详情摘要' },
    { key: 'ZYYCJGFL', label: '结果分类' },
    { key: 'ZYYCJGCZYJ', label: '医生处置意见' },
    { key: 'ZYYCJGFKJG', label: '被通知人反馈' },
    { key: 'ZYYCJGTZRQ', label: '通知日期' },
    { key: 'ZYYCJGTZSJ', label: '通知时间' },
    { key: 'WORKER', label: '经办人' },
    { key: 'ZYYCJGBTZR', label: '被通知人' },
    { key: 'NEXT_DATE', label: '预定随访日期' },
  ],
  FOLLOW_UPS: [
    { key: 'ID', label: '流水ID' },
    { key: 'PERSONID', label: '档案编号' },
    { key: 'ZYYCJGTJBH', label: '体检流水号' },
    { key: 'HFresult', label: '回访结论详情' },
    { key: 'SFTIME', label: '随访结案日期' },
    { key: 'SFSJ', label: '随访时间' },
    { key: 'SFGZRY', label: '随访经办人' },
    { key: 'jcsf', label: '医学复查标记' },
    { key: 'XCSFTIME', label: '下次预定日期' },
  ]
};

export default function ExportPage() {
  const { toast } = useToast()
  const [source, setSource] = React.useState<ExportSource>('ABNORMAL_RESULTS')
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [loadingData, setLoadingData] = React.useState(false)
  const [recordCount, setRecordCount] = React.useState(0)
  
  const [dateRange, setDateRange] = React.useState({
    start: '',
    end: ''
  })

  // 物理读取当前选定数据源的条数
  const refreshStats = React.useCallback(async () => {
    setLoadingData(true);
    try {
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
    } catch (e) {
      toast({ variant: "destructive", title: "数据读取失败", description: "无法连接中心数据库统计条数" });
    } finally {
      setLoadingData(false);
    }
  }, [source, dateRange, toast]);

  React.useEffect(() => {
    setSelectedColumns(COLUMN_MAP[source].map(c => c.key));
    refreshStats();
  }, [source, refreshStats]);

  const handleToggleColumn = (key: string) => {
    setSelectedColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    setSelectedColumns(COLUMN_MAP[source].map(c => c.key));
  };

  const handleClearAll = () => {
    setSelectedColumns([]);
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast({ variant: "destructive", title: "导出失败", description: "请至少选择一个导出字段" });
      return;
    }

    setSubmitting(true);
    try {
      let rawData: any[] = [];
      switch (source) {
        case 'PATIENTS': rawData = await DataService.getPatients(); break;
        case 'ABNORMAL_RESULTS': rawData = await DataService.getAbnormalResults(); break;
        case 'FOLLOW_UPS': rawData = await DataService.getFollowUps(); break;
      }

      const filteredData = rawData.filter(item => {
        const itemDate = item.OCCURDATE || item.ZYYCJGTZRQ || item.SFTIME;
        if (!itemDate) return true;
        if (dateRange.start && itemDate < dateRange.start) return false;
        if (dateRange.end && itemDate > dateRange.end) return false;
        return true;
      });

      if (filteredData.length === 0) {
        toast({ variant: "destructive", title: "无数据", description: "所选范围内未检索到任何记录" });
        return;
      }

      const exportData = filteredData.map(item => {
        const row: Record<string, any> = {};
        COLUMN_MAP[source].forEach(col => {
          if (selectedColumns.includes(col.key)) {
            let val = item[col.key];
            if (col.key === 'jcsf') val = val ? '是' : '否';
            if (col.key === 'ZYYCJGJKXJ') val = val ? '已宣教' : '未宣教';
            if (col.key === 'IS_NOTIFIED') val = val ? '已通知' : '未通知';
            row[col.label] = val === null || val === undefined ? '-' : val;
          }
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "导出数据");
      
      const fileName = `${source === 'PATIENTS' ? '全院档案' : source === 'ABNORMAL_RESULTS' ? '异常流水' : '随访流水'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({ title: "导出成功", description: `已成功生成 ${filteredData.length} 条业务记录` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "系统错误", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">数据导出中心</h1>
          <p className="text-muted-foreground text-sm mt-1 font-medium">临床科研统计 · 全院数据物理备份 · 自定义字段引擎</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 border-primary/20 bg-primary/5 text-primary font-bold flex items-center gap-2">
          {loadingData ? <Loader2 className="h-3 w-3 animate-spin" /> : <SearchCheck className="h-3 w-3" />}
          当前库中就绪: {recordCount} 条
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm border-t-4 border-t-primary">
            <CardHeader className="pb-3 border-b bg-muted/5">
              <CardTitle className="text-base flex items-center gap-2">
                <TableIcon className="h-4 w-4 text-primary" />
                数据源与过滤
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">中心库表</Label>
                <Select value={source} onValueChange={(v: ExportSource) => setSource(v)}>
                  <SelectTrigger className="h-10 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABNORMAL_RESULTS">重要异常结果流水 (SP_ZYJG)</SelectItem>
                    <SelectItem value="FOLLOW_UPS">随访结案流水 (SP_SF)</SelectItem>
                    <SelectItem value="PATIENTS">全院患者电子档案 (SP_PERSON)</SelectItem>
                  </SelectContent>
                </Select>
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
                <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                  * 系统将自动匹配建档日期或通知日期。留空则导出全量历史数据。
                </p>
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
                  重新同步条数统计
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
          
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[10px] text-amber-800 leading-relaxed">
              <strong>物理导出声明：</strong> 导出的 .xlsx 文件包含敏感临床信息。请确保导出操作符合院内数据安全管理规范。所有导出行为将记录在审计日志中。
            </div>
          </div>
        </div>

        <Card className="md:col-span-2 shadow-sm border-t-4 border-t-primary">
          <CardHeader className="pb-3 border-b bg-muted/5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-primary" />
                自定义字段勾选
              </CardTitle>
              <CardDescription className="text-xs">选择需要包含在报表中的临床字段</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-8 text-[11px] font-bold">全选字段</Button>
              <Button variant="outline" size="sm" onClick={handleClearAll} className="h-8 text-[11px] font-bold">清空选择</Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {COLUMN_MAP[source].map((col) => (
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

            <div className="mt-8 p-10 bg-muted/30 rounded-xl border-2 border-dashed flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-inner mb-4">
                  <FileSpreadsheet className="h-8 w-8 text-primary opacity-40" />
               </div>
               <h4 className="text-sm font-bold text-foreground">导出引擎就绪</h4>
               <p className="text-[11px] text-muted-foreground mt-2 max-w-sm leading-relaxed">
                 系统将根据您选择的 <span className="text-primary font-bold">{selectedColumns.length}</span> 个字段，为 <span className="text-primary font-bold">{recordCount}</span> 条记录生成一份符合审计标准的 Excel 文件。
               </p>
               <div className="flex gap-4 mt-6">
                  <Badge variant="secondary" className="text-[9px] px-2 py-0.5 font-mono">ENCODING: UTF-8</Badge>
                  <Badge variant="secondary" className="text-[9px] px-2 py-0.5 font-mono">FORMAT: XLSX</Badge>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
