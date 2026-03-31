import Link from "next/link"

export default function ContactsPage() {
  return (
    <div className="px-8 py-7">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">人脉数据库</h1>
        <Link
          href="/contacts/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新增联系人
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
        <div className="text-4xl mb-3">🚧</div>
        <p className="text-sm">人脉数据库页面即将上线</p>
      </div>
    </div>
  )
}
