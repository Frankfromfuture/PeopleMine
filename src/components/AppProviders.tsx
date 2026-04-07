'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'sonner'

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        closeButton
        toastOptions={{
          className:
            'border border-line-standard bg-white text-text-primary shadow-dialog font-sans [font-feature-settings:"cv01"_1,"ss03"_1]',
          duration: 2800,
        }}
      />
    </QueryClientProvider>
  )
}
