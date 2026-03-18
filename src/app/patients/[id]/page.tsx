import * as React from 'react'
import { MOCK_PERSONS } from '@/lib/mock-store'
import { PatientDetailClient } from './patient-detail-client'

export async function generateStaticParams() {
  return MOCK_PERSONS.map((person) => ({
    id: person.PERSONID,
  }))
}

export default async function PatientDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  return <PatientDetailClient id={id} />
}
