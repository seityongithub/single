// Live Discord banner resolver.
// Lanyard doesn't expose profile banners, so we read the banner hash from a
// public profile proxy (server-side, to avoid CORS + rate limits) and build
// the Discord CDN url. Cached briefly so it stays "real time" without hammering.

import { NextResponse } from 'next/server'

export const revalidate = 0

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!/^\d{5,25}$/.test(id)) {
    return NextResponse.json({ banner: null }, { status: 400 })
  }

  try {
    const res = await fetch(`https://dcdn.dstn.to/profile/${id}`, {
      headers: { accept: 'application/json' },
      next: { revalidate: 60 },
    })
    if (!res.ok) return NextResponse.json({ banner: null })

    const json = (await res.json()) as {
      user?: { banner?: string | null }
    }
    const hash = json.user?.banner
    if (!hash) return NextResponse.json({ banner: null })

    const ext = hash.startsWith('a_') ? 'gif' : 'png'
    const banner = `https://cdn.discordapp.com/banners/${id}/${hash}.${ext}?size=600`
    return NextResponse.json({ banner })
  } catch {
    return NextResponse.json({ banner: null })
  }
}
