'use client'

import useSWR from 'swr'

const fetcher = async (url: string): Promise<string | null> => {
  const res = await fetch(url)
  if (!res.ok) return null
  const json = (await res.json()) as { banner?: string | null }
  return json.banner ?? null
}


export function useDiscordBanner(discordId: string) {
  const { data } = useSWR(
    discordId ? `/api/discord-banner/${discordId}` : null,
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: false },
  )
  return data ?? null
}
