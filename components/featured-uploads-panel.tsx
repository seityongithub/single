'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Play, Video } from 'lucide-react'

export type FeaturedUpload = {
  platform: 'youtube' | 'tiktok'
  title: string
  url: string
  thumbnail?: string | null
  publishedAt?: string | null
  ageDays?: number | null
  fresh?: boolean
}

function ageLabel(upload: FeaturedUpload): string {
  if (typeof upload.ageDays !== 'number') return 'Recent upload'
  if (upload.ageDays < 1 / 24) return 'Just now'
  if (upload.ageDays < 1) return `${Math.max(1, Math.floor(upload.ageDays * 24))}h ago`
  const days = Math.floor(upload.ageDays)
  return `${days}d ago`
}

export function FeaturedUploadsPanel({ discordId }: { discordId: string }) {
  const [uploads, setUploads] = useState<FeaturedUpload[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch(`/api/latest-upload/${encodeURIComponent(discordId)}`, {
          cache: 'no-store',
          headers: { accept: 'application/json' },
        })
        if (!response.ok) {
          if (!cancelled) setUploads([])
          return
        }
        const json = await response.json()
        if (!cancelled) setUploads(Array.isArray(json?.uploads) ? json.uploads : [])
      } catch {}
    }

    load()
    const timer = window.setInterval(load, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [discordId])

  return (
    <div className="xclue-hover-card min-w-0 overflow-hidden rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm">
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <Video className="h-4 w-4 shrink-0 text-gold" />
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Featured uploads
        </h2>
      </div>

      {uploads.length === 0 ? (
        <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
          No uploads from the last 4 days.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {uploads.map((upload) => {
            const isYouTube = upload.platform === 'youtube'
            return (
              <a
                key={`${upload.platform}-${upload.url}`}
                href={upload.url}
                target="_blank"
                rel="noreferrer"
                className="xclue-hover-row group flex min-w-0 items-center gap-3 rounded-xl border border-border bg-secondary/40 p-2.5"
              >
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-black/50">
                  {upload.thumbnail ? (
                    <img
                      src={upload.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      {isYouTube ? <Play className="h-5 w-5 text-gold/70" /> : <Video className="h-5 w-5 text-gold/70" />}
                    </div>
                  )}
                  {upload.fresh && (
                    <span className="absolute left-1 top-1 rounded bg-gold px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-black">
                      New
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground" title={upload.title}>
                    {upload.title}
                  </p>
                  <p className="mt-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                    <span>{isYouTube ? 'YouTube' : 'TikTok'}</span>
                    <span>•</span>
                    <span>{ageLabel(upload)}</span>
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-gold" />
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
