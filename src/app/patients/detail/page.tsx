
"use client"

import * as React from 'react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PatientDetailClient } from '../[id]/patient-detail-client'
import { Loader2 } from 'lucide-react'

/**
 * 内部组件：从查询参数中提取 ID 并渲染详情
 */
function PatientDetailContainer() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-muted-foreground">
        <div className="bg-muted p-4 rounded-full mb-4">
          <Loader2 className="h-8 w-8 animate-spin opacity-20" />
        </div>
        <p className="text-sm font-bold">未检测到有效的档案编号</p>
        <p className="text-[10px] uppercase tracking-widest mt-2">请从档案中心重新进入</p>
      </div>
    )
  }

  return <PatientDetailClient id={id} />
}

/**
 * 患者详情入口页面
 * 采用查询参数模式 (?id=...) 以完美兼容 Electron 静态导出 (output: export)
 */
export default function PatientDetailPage() {
  return (
    <Suspense fallback={
      <div className="h-full w-full flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    }>
      <PatientDetailContainer />
    </Suspense>
  )
}
