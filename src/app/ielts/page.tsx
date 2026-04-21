import { IELTSTest } from '@/components/IELTSTest'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IELTS Mock Test — Core English',
}

export default function IELTSPage() {
  return <IELTSTest />
}
