import { getAuthUserId } from "@/lib/session"
import { db } from "@/lib/db"
import DashboardClient from "./DashboardClient"

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "早上好"
  if (h < 18) return "下午好"
  return "晚上好"
}

function getToday() {
  return new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  })
}

export default async function DashboardPage() {
  const userId = await getAuthUserId().catch(() => "")

  let displayName = "同学"
  let dbError: string | null = null

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true },
    })
    displayName =
      user?.name ||
      (user?.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : "同学")
  } catch (error) {
    dbError = error instanceof Error ? error.message : "数据库连接失败"
    console.error("数据库错误:", error)
  }

  const greeting = getGreeting()
  const today    = getToday()

  return (
    <div className="p-6 pt-4">
      {/* DB error banner */}
      {dbError && (
        <div className="mb-4 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-800">
            <span className="font-semibold">⚠️ 数据库暂时不可用：</span> {dbError}
          </p>
          <p className="text-xs text-gray-700 mt-1">
            数据库连接失败，刷新页面即可恢复。若持续出现请检查 DATABASE_URL 配置。
          </p>
        </div>
      )}

      {/* Dashboard client (header + canvas) */}
      <DashboardClient
        greeting={greeting}
        today={today}
        displayName={displayName}
      />
    </div>
  )
}
