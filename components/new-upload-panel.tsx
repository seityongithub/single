'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Loader2, Play, Video } from 'lucide-react'

export type LatestUpload = {
  platform: 'youtube' | 'tiktok'
  title: string
  url: string
  thumbnail?: string | null
  publishedAt?: string | null
  ageDays?: number | null
  fresh?: boolean
}

export function NewUploadPanel({ discordId }: { discordId: string }) {
  const [upload, setUpload] = useState<LatestUpload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await fetch(`/api/latest-upload/${encodeURIComponent(discordId)}`, {
          cache: 'no-store',
          headers: { accept: 'application/json' },
        })
        if (!response.ok) {
          if (!cancelled) setUpload(null)
          return
        }
        const json = await response.json()
        if (!cancelled) setUpload(json?.upload ?? null)
      } catch {
        if (!cancelled) setUpload(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const timer = window.setInterval(load, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [discordId])

  const platformName = upload?.platform === 'tiktok' ? 'TikTok' : 'YouTube'
  const PlatformIcon = upload?.platform === 'youtube' ? Play : Video

  return (
    <div className="xclue-hover-card xclue-activity-safe overflow-hidden rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm">
      <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Video className="h-4 w-4 shrink-0 text-gold" />
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            New upload
          </h2>
        </div>
        {upload && (
          <span className="shrink-0 rounded-full border border-gold/30 bg-gold/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-gold">
            {upload.fresh ? 'NEW • ' : ''}{platformName}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-gold" />
          Checking latest upload…
        </div>
      ) : upload ? (
        <a
          href={upload.url}
          target="_blank"
          rel="noreferrer"
          className="xclue-hover-row block overflow-hidden rounded-xl border border-border bg-secondary/40"
        >
          <div className="relative aspect-video w-full overflow-hidden bg-black/50">
            {upload.thumbnail ? (
              <img
                src={upload.thumbnail}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <PlatformIcon className="h-8 w-8 text-gold/60" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/65 backdrop-blur-sm">
              <ExternalLink className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <div className="min-w-0 p-3">
            <p className="truncate text-sm font-semibold text-foreground" title={upload.title}>
              {upload.title}
            </p>
            <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {typeof upload.ageDays === 'number' ? `${Math.max(0, Math.floor(upload.ageDays))}d ago • ` : ''}Latest {platformName} upload
            </p>
          </div>
        </a>
      ) : (
        <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
          No recent upload found.
        </div>
      )}
    </div>
  )
}
