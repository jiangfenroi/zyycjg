
import * as React from 'react'

/**
 * 静态导出模式下，动态路由必须提供 generateStaticParams。
 * 由于我们已迁移至 /patients/detail?id= 模式，
 * 此处提供一个占位符以消除 Next.js 构建错误。
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: 'static-placeholder' }];
}

export default function StaticPlaceholderPage() {
  return (
    <div className="p-20 text-center text-muted-foreground text-xs italic">
      正在重定向至中心化档案视图...
    </div>
  );
}
