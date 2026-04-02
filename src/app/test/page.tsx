import { redirect } from 'next/navigation'
import TestDashboard from './TestDashboard'

export default function TestPage() {
  if (process.env.NODE_ENV !== 'development') redirect('/')
  return <TestDashboard />
}
