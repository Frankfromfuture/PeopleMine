import { requireAuth } from "@/lib/session"
import { db } from "@/lib/db"
import AppTopBar from "@/components/AppTopBar"
import AppSidebar from "@/components/AppSidebar"
import { LoadingProvider } from "@/components/ThinkingToast"
import { redirect } from "next/navigation"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user: { phone: string; name: string | null } | null = null

  try {
    const { userId } = await requireAuth()
    user = await db.user.findUnique({
      where: { id: userId },
      select: { phone: true, name: true },
    })
  } catch {
    if (process.env.NODE_ENV !== 'development') {
      redirect("/login")
    }
    // 开发模式：使用 mock 用户
    user = { phone: '13800138000', name: 'Demo 用户' }
  }

  return (
    <LoadingProvider>
      <div className="min-h-screen bg-gray-50">
        <AppTopBar phone={user?.phone} name={user?.name} />
        <AppSidebar />
        <main className="pt-12 ml-[220px] min-h-screen">
          {children}
        </main>
      </div>
    </LoadingProvider>
  )
}
