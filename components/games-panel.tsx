'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Gamepad2, Music4 } from 'lucide-react'
import type { LanyardData } from '@/lib/lanyard'
import { playingGames, activityImage, spotifyNowPlaying } from '@/lib/lanyard'

function elapsed(start?: number): string | null {
  if (!start) return null
  const diff = Date.now() - start
  if (diff < 0) return null
  const mins = Math.floor(diff / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h > 0) return `${h}h ${m}m elapsed`
  return `${m}m elapsed`
}

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function SpotifyActivity({ data }: { data?: LanyardData }) {
  const spotify = spotifyNowPlaying(data)
  // Tick every second so the timestamp/progress updates live.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!spotify?.start) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [spotify?.start])

  if (!spotify) return null

  const total =
    spotify.start && spotify.end ? spotify.end - spotify.start : undefined
  const position = spotify.start ? now - spotify.start : 0
  const clamped = total ? Math.min(Math.max(position, 0), total) : position
  const pct = total ? (clamped / total) * 100 : 0

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-[#ffffff]/30 bg-[#ffffff]/[0.06] p-3">
      <div className="mb-2 flex items-center gap-2">
        <Music4 className="h-3.5 w-3.5 text-[#ffffff]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ffffff]">
          Listening on Spotify
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/40">
          {spotify.albumArt && (
            <Image
              src={spotify.albumArt || '/placeholder.svg'}
              alt=""
              width={48}
              height={48}
              unoptimized
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="block truncate text-sm font-semibold text-foreground" title={spotify.song}>
            {spotify.song}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            by {spotify.artist}
          </p>
        </div>
      </div>
      {total && (
        <div className="mt-3">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#ffffff] transition-[width] duration-1000 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
            <span>{fmt(clamped)}</span>
            <span>{fmt(total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function GamesPanel({ data }: { data?: LanyardData }) {
  const games = playingGames(data)
  const hasSpotify = !!spotifyNowPlaying(data)

  return (
    <div className="xclue-hover-card min-w-0 w-full overflow-hidden rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm">
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <Gamepad2 className="h-4 w-4 text-gold" />
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Activity
        </h2>
      </div>

      <SpotifyActivity data={data} />

      {games.length === 0 ? (
        hasSpotify ? null : (
        <p className="text-sm text-muted-foreground">
          Not in a game right now.
        </p>
        )
      ) : (
        <ul className="flex flex-col gap-3">
          {games.map((game) => {
            const img = activityImage(game)
            const time = elapsed(game.timestamps?.start)
            return (
              <li
                key={game.id}
                className="xclue-hover-row flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-border bg-secondary/40 p-3"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-gold/25 bg-black/40">
                  {img ? (
                    <Image
                      src={img || '/placeholder.svg'}
                      alt=""
                      width={48}
                      height={48}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Gamepad2 className="h-5 w-5 text-gold/70" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {game.name}
                  </p>
                  {game.details && (
                    <p className="truncate text-xs text-muted-foreground">
                      {game.details}
                    </p>
                  )}
                  {game.state && (
                    <p className="truncate text-xs text-muted-foreground">
                      {game.state}
                    </p>
                  )}
                  {time && (
                    <p className="mt-0.5 font-mono text-[10px] text-gold/70">
                      {time}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
