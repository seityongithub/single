'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'

interface YTPlayer {
  playVideo: () => void
  pauseVideo: () => void
  mute: () => void
  unMute: () => void
  isMuted: () => boolean
  setVolume: (v: number) => void
  getVolume?: () => number
  getCurrentTime: () => number
  getDuration: () => number
  seekTo: (s: number, allowSeekAhead: boolean) => void
  destroy: () => void
}

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

function parseVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null
      return u.searchParams.get('v')
    }
    return null
  } catch {
    return null
  }
}

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

let apiPromise: Promise<void> | null = null
function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve()
    }
    document.head.appendChild(script)
  })
  return apiPromise
}

interface MusicPlayerProps {
  youtubeUrl: string
  startSignal?: number
}

export function MusicPlayer({ youtubeUrl, startSignal = 0 }: MusicPlayerProps) {
  const holderRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const rafRef = useRef<number | null>(null)
  const startRequestedRef = useRef(false)
  const lastSignalRef = useRef(0)

  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(70)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [title, setTitle] = useState('Loading track…')
  const [thumb, setThumb] = useState('')

  const videoId = parseVideoId(youtubeUrl)

  useEffect(() => {
    if (!videoId) return
    setThumb(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.title && setTitle(j.title))
      .catch(() => {})
  }, [videoId])

  const tick = useCallback(() => {
    const player = playerRef.current
    if (player) {
      try {
        setCurrent(player.getCurrentTime())
        const d = player.getDuration()
        if (d > 0) setDuration(d)
      } catch {}
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    const onEnter = () => {
      startRequestedRef.current = true
      const player = playerRef.current
      if (!player) return

      // The iframe has already been allowed to autoplay muted. The Enter
      // click is now a real user gesture, so unmuting here is reliable.
      player.unMute()
      player.setVolume(volume)
      setMuted(false)
      player.playVideo()
      startRequestedRef.current = false
    }
    window.addEventListener('xclue:music-start', onEnter)
    return () => window.removeEventListener('xclue:music-start', onEnter)
  }, [volume])

  useEffect(() => {
    if (!videoId || !holderRef.current) return
    let disposed = false

    loadYouTubeApi().then(() => {
      if (disposed || !holderRef.current || !window.YT) return

      playerRef.current?.destroy()
      playerRef.current = new window.YT.Player(holderRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          loop: 1,
          playlist: videoId,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: { target: YTPlayer }) => {
            setReady(true)
            setDuration(event.target.getDuration())
            event.target.setVolume(volume)
            event.target.mute()
            // Muted autoplay is browser-friendly. Audio becomes audible only
            // after the Enter interaction dispatches xclue:music-start.
            event.target.playVideo()
            if (startRequestedRef.current || startSignal) {
              event.target.unMute()
              event.target.setVolume(volume)
              event.target.playVideo()
              setMuted(false)
              startRequestedRef.current = false
            }
            rafRef.current = requestAnimationFrame(tick)
          },
          onStateChange: (event: { data: number; target: YTPlayer }) => {
            const states = window.YT?.PlayerState
            if (!states) return
            setPlaying(event.data === states.PLAYING)
            if (event.data === states.ENDED) {
              // Playlist looping is the primary mechanism. This is an extra
              // fallback for single-video embeds.
              event.target.seekTo(0, true)
              event.target.playVideo()
            }
          },
        },
      })
    })

    return () => {
      disposed = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      playerRef.current?.destroy()
      playerRef.current = null
      setReady(false)
      setPlaying(false)
    }
  }, [videoId, tick])

  useEffect(() => {
    if (!startSignal || startSignal === lastSignalRef.current) return
    lastSignalRef.current = startSignal
    const player = playerRef.current
    if (!player) {
      startRequestedRef.current = true
      return
    }
    player.unMute()
    player.setVolume(volume)
    player.playVideo()
    setMuted(false)
  }, [startSignal, volume])

  const togglePlay = () => {
    const player = playerRef.current
    if (!player) return
    if (playing) player.pauseVideo()
    else player.playVideo()
  }

  const toggleMute = () => {
    const player = playerRef.current
    if (!player) return
    if (player.isMuted() || muted) {
      player.unMute()
      player.setVolume(volume || 70)
      setVolume(volume || 70)
      setMuted(false)
    } else {
      player.mute()
      setMuted(true)
    }
  }

  const changeVolume = (next: number) => {
    const safe = Math.max(0, Math.min(100, next))
    setVolume(safe)
    if (safe === 0) {
      playerRef.current?.mute()
      setMuted(true)
    } else {
      playerRef.current?.unMute()
      playerRef.current?.setVolume(safe)
      setMuted(false)
    }
  }

  const onSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current || !duration) return
    const next = (Number(event.target.value) / 100) * duration
    playerRef.current.seekTo(next, true)
    setCurrent(next)
  }

  const progress = duration ? Math.min(100, (current / duration) * 100) : 0

  return (
    <div className="xclue-hover-card relative overflow-hidden rounded-xl border border-border bg-black/40 p-4 backdrop-blur-sm shadow-none">
      <div className="pointer-events-none fixed -left-[10000px] top-0 h-1 w-1 overflow-hidden opacity-0" aria-hidden>
        <div ref={holderRef} className="h-1 w-1" />
      </div>

      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 sm:gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gold/25 bg-black sm:h-16 sm:w-16">
          {thumb && (
            <img
              src={thumb}
              alt=""
              className="h-full w-full object-cover"
              onError={(event) => {
                if (videoId && !event.currentTarget.src.includes('hqdefault')) {
                  event.currentTarget.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
                }
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {playing && (
            <div className="absolute bottom-1 left-1 flex items-end gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="w-0.5 animate-pulse-slow rounded-full bg-gold"
                  style={{ height: `${6 + ((i * 5) % 12)}px`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="xclue-music-content min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/70">Now Playing</p>
          <p className="min-w-0 truncate whitespace-nowrap text-sm font-semibold text-foreground">{title}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{fmt(current)}</span>
            <div className="relative h-1.5 min-w-0 flex-1">
              <div className="absolute inset-0 rounded-full bg-white/10" />
              <div className="absolute inset-y-0 left-0 rounded-full bg-gold" style={{ width: `${progress}%` }} />
              <input type="range" min={0} max={100} value={progress} onChange={onSeek} aria-label="Seek" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            </div>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{fmt(duration)}</span>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={toggleMute}
            disabled={!ready}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:text-foreground disabled:opacity-40"
          >
            {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={muted ? 0 : volume}
            onInput={(e) => changeVolume(Number((e.target as HTMLInputElement).value))}
            onChange={(e) => changeVolume(Number(e.target.value))}
            aria-label="Volume"
            disabled={!ready}
            className="xclue-volume-slider w-20 appearance-none rounded-full bg-white/15 accent-white disabled:opacity-40"
          />
        </div>

        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
          disabled={!ready}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold text-primary-foreground transition hover:scale-105 disabled:opacity-50"
        >
          {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 sm:hidden">
        <button type="button" onClick={toggleMute} disabled={!ready} aria-label={muted ? 'Unmute' : 'Mute'} className="grid h-8 w-8 place-items-center text-muted-foreground">
          {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={muted ? 0 : volume}
          onInput={(e) => changeVolume(Number((e.target as HTMLInputElement).value))}
            onChange={(e) => changeVolume(Number(e.target.value))}
          aria-label="Volume"
          disabled={!ready}
          className="xclue-volume-slider min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-white disabled:opacity-40"
        />
      </div>
    </div>
  )
}
