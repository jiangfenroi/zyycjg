
"use client"

import * as React from 'react'
import { Download, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, Calendar, Table as TableIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from '@/hooks/use-toast'
import { DataService } from '@/services/data-service'
import * as XLSX from 'xlsx'

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
  
  const [dateRange, setDateRange] = React.useState({
    start: '',
    end: ''
  })

  React.useEffect(() => {
    // 默认全选当前数据源的列
    setSelectedColumns(COLUMN_MAP[source].map(c => c.key));
  }, [source]);

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
      
      // 物理按需获取中心库数据
      switch (source) {
        case 'PATIENTS':
          rawData = await DataService.getPatients();
          break;
        case 'ABNORMAL_RESULTS':
          rawData = await DataService.getAbnormalResults();
          break;
        case 'FOLLOW_UPS':
          rawData = await DataService.getFollowUps();
          break;
      }

      // 业务日期筛选逻辑
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

      // 格式化数据并映射表头
      const exportData = filteredData.map(item => {
        const row: Record<string, any> = {};
        COLUMN_MAP[source].forEach(col => {
          if (selectedColumns.includes(col.key)) {
            let val = item[col.key];
            // 特殊字段语义化处理
            if (col.key === 'jcsf') val = val ? '是' : '否';
            if (col.key === 'ZYYCJGJKXJ') val = val ? '已宣教' : '未宣教';
            if (col.key === 'IS_NOTIFIED') val = val ? '已通知' : '未通知';
            row[col.label] = val === null || val === undefined ? '-' : val;
          }
        });
        return row;
      });

      // 调用 xlsx 物理生成 Excel
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
      <div>
        <h1 className="text-3xl font-bold text-primary">数据导出中心</h1>
        <p className="text-muted-foreground text-sm mt-1">临床科研统计 · 全院数据物理备份</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/5">
              <CardTitle className="text-base flex items-center gap-2">
                <TableIcon className="h-4 w-4 text-primary" />
                第一步：选择数据源
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>中心库表选择</Label>
                <Select value={source} onValueChange={(v: ExportSource) => setSource(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABNORMAL_RESULTS">重要异常结果流水 (SP_ZYJG)</SelectItem>
                    <SelectItem value="FOLLOW_UPS">随访结案流水 (SP_SF)</SelectItem>
                    <SelectItem value="PATIENTS">全院患者电子档案 (SP_PERSON)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  系统将直接从服务器 MySQL 数据库提取最新业务流水。请确保当前账户具有导出权限。
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/5">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                第二步：设置时间区间
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">起始日期</Label>
                  <Input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">截止日期</Label>
                  <Input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                * 留空则导出全量历史数据。
              </p>
            </CardContent>
          </Card>

          <Button 
            className="w-full h-14 text-base font-bold shadow-lg" 
            onClick={handleExport}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <FileSpreadsheet className="mr-2 h-5 w-5" />}
            执行 Excel 物理导出
          </Button>
        </div>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" />
                第三步：自定义导出列
              </CardTitle>
              <CardDescription className="text-xs">勾选需要包含在报表中的字段</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-7 text-[10px]">全选</Button>
              <Button variant="outline" size="sm" onClick={handleClearAll} className="h-7 text-[10px]">重置</Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {COLUMN_MAP[source].map((col) => (
                <div key={col.key} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => handleToggleColumn(col.key)}>
                  <Checkbox 
                    id={`col-${col.key}`} 
                    checked={selectedColumns.includes(col.key)}
                    onCheckedChange={() => handleToggleColumn(col.key)}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor={`col-${col.key}`} className="text-sm font-bold group-hover:text-primary transition-colors cursor-pointer">
                      {col.label}
                    </Label>
                    <p className="text-[10px] text-muted-foreground font-mono">{col.key}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-muted/30 rounded-xl border-2 border-dashed flex flex-col items-center text-center">
               <FileSpreadsheet className="h-10 w-10 text-muted-foreground opacity-20 mb-3" />
               <h4 className="text-sm font-bold text-muted-foreground">导出预览准备就绪</h4>
               <p className="text-[10px] text-muted-foreground mt-1 max-w-sm">
                 系统将根据您选择的 {selectedColumns.length} 个字段，生成一份符合临床审计标准的 .xlsx 文件。导出的数据可以直接在 Microsoft Excel 或 WPS 中查阅。
               </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
