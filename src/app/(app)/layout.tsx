import { requireAuth } from "@/lib/session"
import AppSidebar from "@/components/AppSidebar"
import { LoadingProvider } from "@/components/ThinkingToast"
import AppProviders from "@/components/AppProviders"
import { redirect } from "next/navigation"
import MobileTopBar from "@/components/MobileTopBar"
import MobileBottomNav from "@/components/MobileBottomNav"

export const dynamic = "force-dynamic"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAuth()
  } catch {
    if (process.env.NODE_ENV !== "development") {
      redirect("/login")
    }
  }

  return (
    <AppProviders>
      <LoadingProvider>
        <div className="flex h-[100dvh] overflow-hidden bg-[#f4f4f4]">
          <div className="hidden md:block">
            <AppSidebar />
          </div>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="md:hidden">
              <MobileTopBar />
            </div>

            <main className="min-w-0 flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
              {children}
            </main>
          </div>

          <MobileBottomNav />
        </div>
      </LoadingProvider>
    </AppProviders>
  )
}
