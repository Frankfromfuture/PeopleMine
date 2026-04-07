import { requireAuth } from "@/lib/session"
import AppSidebar from "@/components/AppSidebar"
import { LoadingProvider } from "@/components/ThinkingToast"
import AppProviders from "@/components/AppProviders"
import { redirect } from "next/navigation"

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
        <div className="flex h-screen overflow-hidden" style={{ background: "#f4f4f4" }}>
          <AppSidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </LoadingProvider>
    </AppProviders>
  )
}
