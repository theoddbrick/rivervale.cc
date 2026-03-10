'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAutoRefresh(intervalMs: number = 10000) {
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh()
    }, intervalMs)

    return () => clearInterval(timer)
  }, [router, intervalMs])
}
