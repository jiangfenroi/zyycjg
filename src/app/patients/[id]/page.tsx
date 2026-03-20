import * as React from 'react'
import { PatientDetailClient } from './patient-detail-client'

/**
 * 为支持 Electron 打包（静态导出），此处返回空数组。
 * 所有的患者详情将交由客户端组件 PatientDetailClient 在运行时从远程数据库动态拉取。
 */
export async function generateStaticParams() {
  return []
}

export default async function PatientDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  return <PatientDetailClient id={id} />
}
