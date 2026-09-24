'use client'

import useSWR from 'swr'
import type { LanyardData, LanyardResponse } from '@/lib/lanyard'

const fetcher = async (url: string): Promise<LanyardData | null> => {
  const res = await fetch(url)
  if (!res.ok) return null
  const json = (await res.json()) as LanyardResponse
  return json.success && json.data ? json.data : null
}


export function useLanyard(discordId: string) {
  const { data, error, isLoading } = useSWR(
    discordId ? `/api/lanyard/${encodeURIComponent(discordId)}` : null,
    fetcher,
    {
      refreshInterval: 10_000,
      revalidateOnFocus: true,
    },
  )

  return { data: data ?? undefined, error, isLoading }
}
