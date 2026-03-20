
import * as React from 'react'

/**
 * 静态导出模式加固：
 * 由于 output: export 不支持运行时动态路径，系统已全面迁移至 /patients/detail?id=... 模式。
 * 此文件提供必要的 generateStaticParams 以确保构建通过。
 */
export const dynamicParams = false;

export function generateStaticParams() {
  // 返回一个静态占位符以满足构建校验
  return [{ id: 'detail' }];
}

export default function PatientIdPlaceholder() {
  return (
    <div className="p-20 text-center text-muted-foreground text-xs italic">
      正在载入中心档案视图...
    </div>
  );
}
