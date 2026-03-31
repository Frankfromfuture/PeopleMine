import Link from "next/link"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export default async function ContactsPage() {
  let userId: string
  try {
    ;({ userId } = await requireAuth())
  } catch {
    // 开发模式 mock
    userId = 'dev-user'
  }

  let contacts = []
  let dbError = null

  try {
    const result = await db.contact.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    })
    contacts = result
  } catch (error) {
    dbError = error instanceof Error ? error.message : '数据库连接失败'
    console.error('数据库错误:', error)
  }

  return (
    <div className="min-h-full">
      {/* ── Database error warning ── */}
      {dbError && (
        <div className="bg-amber-50 border-b border-amber-200 px-8 py-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">⚠️ 数据库暂时不可用：</span> {dbError}
          </p>
          <p className="text-xs text-amber-700 mt-1">
            请检查 DATABASE_URL 配置或联系管理员。可以使用「生成测试数据」功能预览功能。
          </p>
        </div>
      )}

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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {contacts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">还没有联系人，先去人物标签页新增一位</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="text-right font-medium px-3 py-3 w-16">操作</th>
                <th className="text-left font-medium px-4 py-3">姓名</th>
                <th className="text-left font-medium px-4 py-3 w-32">关系角色</th>
                <th className="text-left font-medium px-4 py-3">标签</th>
                <th className="text-center font-medium px-3 py-3 w-20">温度</th>
                <th className="text-center font-medium px-3 py-3 w-20">信任度</th>
                <th className="text-left font-medium px-4 py-3">公司</th>
                <th className="text-left font-medium px-4 py-3">职位</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => {
                const tags = contact.tags ? JSON.parse(contact.tags) : []
                const tempEmoji = { COLD: '❄️', WARM: '🌤️', HOT: '🔥' }[contact.temperature || ''] || '—'
                const roleEmoji = {
                  BIG_INVESTOR: '💰',
                  GATEWAY: '🚪',
                  ADVISOR: '🧠',
                  THERMOMETER: '🌡️',
                  LIGHTHOUSE: '🏮',
                  COMRADE: '⚔️',
                }[contact.relationRole] || ''
                const roleLabel = {
                  BIG_INVESTOR: '大金主',
                  GATEWAY: '传送门',
                  ADVISOR: '智囊',
                  THERMOMETER: '温度计',
                  LIGHTHOUSE: '灯塔',
                  COMRADE: '战友',
                }[contact.relationRole] || contact.relationRole
                return (
                  <tr key={contact.id} className="group border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="flex justify-center items-center gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                        <Link
                          href={`/contacts/${contact.id}/edit`}
                          className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                          title="修改"
                        >
                          ✏️
                        </Link>
                        <form action={`/api/contacts/${contact.id}`} method="post" className="inline">
                          <input type="hidden" name="_action" value="delete" />
                          <button
                            type="submit"
                            className="w-6 h-6 text-xs rounded border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center"
                            aria-label={`删除 ${contact.name}`}
                            title="删除"
                          >
                            ✕
                          </button>
                        </form>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{contact.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <span>{roleEmoji}</span>
                        <span>{roleLabel}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <span key={tag} className="inline-block px-2 py-0.5 text-xs bg-violet-100 text-violet-700 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">{tempEmoji}</td>
                    <td className="px-3 py-3 text-center">
                      {contact.trustLevel ? (
                        <span className="text-amber-500">{'★'.repeat(contact.trustLevel)}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{contact.company || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{contact.title || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </div>
  )
}
