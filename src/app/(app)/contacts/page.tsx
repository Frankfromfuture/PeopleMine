import Link from "next/link"
import { db } from "@/lib/db"
import PageHeader from "@/components/PageHeader"
import { getAuthUserId } from "@/lib/session"
import ContactsTable from "./ContactsTable"

export default async function ContactsPage() {
  const userId = await getAuthUserId()

  let contacts: Array<{
    id: string
    name: string
    fullName: string | null
    roleArchetype: 'BREAKER' | 'EVANGELIST' | 'ANALYST' | 'BINDER' | null
    spiritAnimal: 'TIGER' | 'PEACOCK' | 'OWL' | 'KOALA' | null
    industry: string | null
    industryL1: string | null
    industryL2: string | null
    temperature: 'COLD' | 'WARM' | 'HOT' | null
    trustLevel: number | null
    chemistryScore: number | null
    company: string | null
    companyName: string | null
    title: string | null
    jobTitle: string | null
    jobPosition: string | null
    jobFunction: string | null
    noteSummary: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    lastContactedAt: Date | null
  }> = []
  let dbError = null

  try {
    const result = await db.contact.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        fullName: true,
        roleArchetype: true,
        spiritAnimal: true,
        industry: true,
        industryL1: true,
        industryL2: true,
        temperature: true,
        trustLevel: true,
        chemistryScore: true,
        company: true,
        companyName: true,
        title: true,
        jobTitle: true,
        jobPosition: true,
        jobFunction: true,
        noteSummary: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        lastContactedAt: true,
      },
    })
    contacts = result
  } catch (error) {
    dbError = error instanceof Error ? error.message : '数据库连接失败'
    console.error('数据库错误', error)
  }

  return (
    <div className="min-h-full">
      {dbError && (
        <div className="border-b border-gray-200 bg-gray-50 px-8 py-4">
          <p className="text-sm text-gray-800">
            <span className="font-semibold">数据库暂时不可用：</span> {dbError}
          </p>
          <p className="mt-1 text-xs text-gray-700">数据库连接失败，刷新页面即可恢复。</p>
        </div>
      )}

      <div className="px-8 py-7">
        <PageHeader
          items={[
            { label: '首页', href: '/dashboard' },
            { label: '人脉资产' },
          ]}
          title="人脉资产"
          summary="集中查看、筛选和维护你的联系人资产，支持继续扩充和回访。"
          hints={[
            '表格按最近更新时间排序，适合连续整理和批量浏览。',
            '这里是进入联系人详情、编辑和继续补录的主入口。',
            '右侧按钮可直接跳去“+人脉”继续新增联系人。',
          ]}
          actions={
            <Link
              href="/contacts/new"
              className="flex items-center gap-1.5 rounded-2xl bg-[#A04F47] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#A04F47]/90"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              +人脉
            </Link>
          }
        />

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <ContactsTable contacts={contacts} />
        </div>
      </div>
    </div>
  )
}
