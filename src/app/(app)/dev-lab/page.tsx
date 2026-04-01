import { redirect } from 'next/navigation'
import { loadTagConfig } from '@/lib/dev/tag-store'
import { loadFormulaConfig } from '@/lib/dev/formula-store'
import DevLabClient from './DevLabClient'

export default async function DevLabPage() {
  if (process.env.NODE_ENV !== 'development') {
    redirect('/')
  }

  const tagConfig = loadTagConfig()
  const formulaConfig = loadFormulaConfig()

  return <DevLabClient tagConfig={tagConfig} formulaConfig={formulaConfig} />
}
