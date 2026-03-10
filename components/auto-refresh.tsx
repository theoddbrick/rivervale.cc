'use client'

import { useAutoRefresh } from '@/hooks/use-auto-refresh'

export function AutoRefresh({ intervalMs = 10000 }: { intervalMs?: number }) {
  useAutoRefresh(intervalMs)
  return null
}
