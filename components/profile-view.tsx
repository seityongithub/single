'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Activity, ArrowLeft, ArrowRight, ArrowUpRight, Clock3, Cpu, Eye, Gamepad2, Headphones, Home, Image as ImageIcon, Keyboard, Monitor, Mouse, Radio, Settings2, ShieldCheck, Sparkles, UserRound, Users, X } from 'lucide-react'
import type { Member } from '@/lib/members'
import type { StoredRecentActivity } from '@/lib/db'
import { getRoleMeta } from '@/lib/members'
import { useLanyard } from '@/hooks/use-lanyard'
import { useDiscordBanner } from '@/hooks/use-discord-banner'
import {
  customStatus,
  displayName,
  emojiImageUrl,
  handle,
  playingGames,
  activityImage,
  statusLabel,
  statusColorClass,
  statusTextClass,
} from '@/lib/lanyard'
import { DiscordAvatar } from '@/components/discord-avatar'
import { StatusDot } from '@/components/status-badge'
import { GamesPanel } from '@/components/games-panel'
import { MusicPlayer } from '@/components/music-player'
import { NewUploadPanel } from '@/components/new-upload-panel'
import { AmbientEffects } from '@/components/ambient-effects'

function DiscordPresencePanel({
  status,
  customText,
  gameCount,
}: {
  status: string
  customText?: string
  gameCount: number
}) {
  const online = status !== 'offline'
  return (
    <div className="xclue-hover-card min-w-0 overflow-hidden rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Radio className="h-4 w-4 text-gold" />
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Discord presence</h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border bg-secondary/40 p-3">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${online ? 'bg-status-online' : 'bg-status-offline'}`} /> Status
          </div>
          <p className="mt-1 text-sm font-semibold">{online ? 'Active' : 'Offline'}</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/40 p-3">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <Gamepad2 className="h-3 w-3" /> Activities
          </div>
          <p className="mt-1 text-sm font-semibold">{gameCount}</p>
        </div>
      </div>
      <div className="mt-2 rounded-xl border border-border bg-secondary/40 p-3">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <ShieldCheck className="h-3 w-3" /> Custom status
        </div>
        <p className="mt-1 truncate text-sm font-medium" title={customText || 'No custom status'}>
          {customText || 'No custom status'}
        </p>
      </div>
    </div>
  )
}

function ProfileInfoPanel({ member }: { member: Member }) {
  return (
    <div className="xclue-hover-card min-w-0 overflow-hidden rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <UserRound className="h-4 w-4 text-gold" />
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Profile info</h2>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Role</span>
          <span className="truncate text-sm font-semibold">{getRoleMeta(member.role).label}</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Profile path</span>
          <span className="truncate font-mono text-xs text-muted-foreground">/{member.profilePath}</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><Clock3 className="h-3 w-3" /> Live sync</span>
          <span className="text-xs font-medium text-gold">Lanyard</span>
        </div>
      </div>
    </div>
  )
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M23 12s0-3.8-.5-5.6a2.9 2.9 0 00-2-2C18.7 4 12 4 12 4s-6.7 0-8.5.4a2.9 2.9 0 00-2 2C1 8.2 1 12 1 12s0 3.8.5 5.6a2.9 2.9 0 002 2C5.3 20 12 20 12 20s6.7 0 8.5-.4a2.9 2.9 0 002-2C23 15.8 23 12 23 12zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z" />
    </svg>
  )
}
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.5 4.1A16.4 16.4 0 0 0 15.7 3l-.5 1a14.6 14.6 0 0 0-6.4 0l-.5-1a16.4 16.4 0 0 0-3.8 1.1C2.1 7.5 1.5 10.8 1.8 14a16.5 16.5 0 0 0 4.7 2.4l1.1-1.5c-.6-.2-1.1-.5-1.6-.8l.4-.3c3.1 1.5 6.5 1.5 9.5 0l.4.3c-.5.3-1 .6-1.6.8l1.1 1.5a16.5 16.5 0 0 0 4.7-2.4c.4-3.7-.6-7-2.9-9.9ZM8.5 13.1c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8Zm7 0c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8Z" />
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.5 3c.3 2.1 1.5 3.6 3.5 4v2.6c-1.3 0-2.5-.4-3.5-1v6.3c0 3.2-2.4 5.6-5.5 5.6S6 18.1 6 15s2.4-5.6 5.5-5.6c.3 0 .6 0 .9.1v2.7c-.3-.1-.6-.2-.9-.2-1.6 0-2.8 1.3-2.8 2.9s1.2 2.9 2.8 2.9 2.8-1.3 2.8-2.9V3h2.2z" />
    </svg>
  )
}
function KickIcon({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden>
      K
    </span>
  )
}

function TwitchIcon({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden>
      T
    </span>
  )
}
function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.6 14.4a.6.6 0 01-.9.2c-2.3-1.4-5.3-1.7-8.7-.9a.6.6 0 11-.3-1.2c3.8-.9 7.1-.5 9.7 1a.6.6 0 01.2.9zm1.2-2.7a.8.8 0 01-1 .3c-2.7-1.6-6.7-2.1-9.9-1.1a.8.8 0 11-.4-1.5c3.6-1.1 8.1-.5 11.1 1.3.4.2.5.7.2 1zm.1-2.8C14.7 9 9.2 8.8 6.1 9.8a.9.9 0 11-.5-1.7C9.1 7 15.1 7.2 18.8 9.4a.9.9 0 11-.9 1.5z" />
    </svg>
  )
}

// Build an outbound link from a stored handle. Handles are stored bare
// (e.g. "@kairu8566" / "wasd.kairu") so the profile stays easy to edit.
function socialHref(platform: string, value: string): string {
  const v = value.replace(/^@/, '')
  switch (platform) {
    case 'youtube':
      return `https://youtube.com/@${v}`
    case 'tiktok':
      return `https://tiktok.com/@${v}`
    case 'spotify':
      return `https://open.spotify.com/user/${v}`
    case 'instagram':
      return `https://instagram.com/${v}`
    case 'discord':
      return `https://discord.com/users/${v}`
    case 'twitter':
      return `https://twitter.com/${v}`
    case 'kick':
      return `https://kick.com/${v}`
    case 'twitch':
      return `https://twitch.tv/${v}`
    default:
      return '#'
  }
}

function SocialRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
}) {
  const inner = (
    <div className="xclue-hover-row flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3 transition hover:border-gold/40">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-black/50 text-gold">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
  return href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    inner
  )
}

function backgroundSrc(value?: string): string | null {
  if (!value) return null
  const v = value.trim()
  if (!v) return null
  if (/^https?:\/\//i.test(v)) return v
  if (v.startsWith('/')) return v
  return `/background/${v}`
}

function AnimatedHandle({ handleValue }: { handleValue: string }) {
  const [shown, setShown] = useState(handleValue)

  useEffect(() => {
    const value = handleValue || ''
    if (value.length <= 1) {
      setShown(value)
      return
    }

    let index = 1
    setShown(value.slice(0, 1))
    const timer = window.setInterval(() => {
      index += 1
      setShown(value.slice(0, index))
      if (index >= value.length) window.clearInterval(timer)
    }, 140)

    return () => window.clearInterval(timer)
  }, [handleValue])

  return (
    <span
      className="inline-block min-w-[2ch] transition-all duration-200"
      aria-label={handleValue}
    >
      {shown}
    </span>
  )
}

const DASHBOARD_SECTIONS = [
  { id: 'profile', label: 'Profile', icon: Home },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'socials', label: 'Socials', icon: Users },
  { id: 'setup---peripherals', label: 'Setup / Peripherals', icon: Settings2 },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon },
  { id: 'view-count', label: 'View Count', icon: Eye },
] as const

function SidebarNav({
  member,
  name,
  status,
  data,
  activeSection,
  onSelect,
}: {
  member: Member
  name: string
  status: string
  data?: import('@/lib/lanyard').LanyardData
  activeSection: string
  onSelect: (id: string) => void
}) {
  return (
    <aside className="xclue-sidebar flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/55 backdrop-blur-xl xl:flex">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <DiscordAvatar data={data} name={name} fallbackSrc={member.avatar || `/profile/${member.profilePath}.png`} size={54} />
            <StatusDot status={status as any} className="absolute bottom-0 right-0 h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{name}</p>
            <p className="truncate font-mono text-xs text-white/45">{member.username}</p>
            <p className={`mt-1 flex items-center gap-1.5 text-[11px] ${statusTextClass(status as any)}`}><span className={`h-2 w-2 rounded-full ${statusColorClass(status as any)}`} />{statusLabel(status as any)}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Profile sections">
        {DASHBOARD_SECTIONS.map(({ icon: Icon, label, id }) => {
          const active = activeSection === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-current={active ? 'page' : undefined}
              className={`xclue-sidebar-link flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${active ? 'bg-white/[0.12] text-white shadow-[inset_3px_0_0_rgba(255,255,255,.9)]' : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'}`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">Real ones</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">stay.</p>
      </div>
    </aside>
  )
}

function formatActivityAge(startedAt: number): string {
  const elapsed = Math.max(0, Date.now() - startedAt)
  const totalMinutes = Math.floor(elapsed / 60_000)
  if (totalMinutes < 1) return 'just now'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours <= 0) return `${minutes}m ago`
  if (minutes <= 0) return `${hours}h ago`
  return `${hours}h ${minutes}m ago`
}

function formatActivityStart(startedAt: number): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(startedAt)
}

function RecentActivityPanel({ activities, name }: { activities: StoredRecentActivity[]; name: string }) {
  return (
    <section className="xclue-dashboard-card overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium">Recent Activity</h2>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">Kept for 6 hours</p>
        </div>
        <Activity className="h-4 w-4 text-white/35" />
      </div>
      <div className="divide-y divide-white/[0.07]">
        {activities.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 text-xs text-white/45">{name} has no recent Discord activity.</div>
        ) : activities.map((activity) => {
          const label = activity.type === 2
            ? 'Listening on Spotify'
            : activity.type === 3
              ? 'Watching'
              : activity.type === 5
                ? 'Competing'
                : 'Playing'
          return (
            <div key={`${activity.activityKey}-${activity.startedAt}`} className="flex min-w-0 items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.07]">
                {activity.image ? <img src={activity.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <Gamepad2 className="h-5 w-5 text-white/60" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{activity.name}</p>
                <p className="truncate text-xs text-white/45">{activity.details || activity.state || label}</p>
                <p className="mt-1 font-mono text-[10px] text-white/30">{formatActivityAge(activity.startedAt)} · since {formatActivityStart(activity.startedAt)}</p>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-white/35">6h</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function SetupStrip({ member }: { member: Member }) {
  const items = [
    { icon: Monitor, label: 'Motherboard', value: member.pcSpecs?.motherboard },
    { icon: Cpu, label: 'CPU', value: member.pcSpecs?.cpu },
    { icon: Monitor, label: 'GPU', value: member.pcSpecs?.gpu },
    { icon: Keyboard, label: 'Keyboard', value: member.peripherals?.keyboard },
    { icon: Mouse, label: 'Mouse', value: member.peripherals?.mouse },
    { icon: Headphones, label: 'Headset', value: member.peripherals?.headset },
  ].filter((item) => item.value)
  if (!items.length) return null
  return (
    <section id="setup---peripherals" className="xclue-dashboard-card scroll-mt-24 rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-white/60" />
        <h2 className="text-base font-medium">Setup / Peripherals</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="xclue-setup-item min-w-0 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
            <Icon className="h-4 w-4 text-white/65" />
            <p className="mt-2 truncate text-xs font-medium">{label}</p>
            <p className="mt-0.5 truncate text-[10px] text-white/40" title={value}>{value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}


function GalleryPanel({ member }: { member: Member }) {
  const images = (member.gallery ?? []).filter(Boolean).slice(0, 10)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (selectedIndex === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedIndex(null)
      if (event.key === 'ArrowLeft') setSelectedIndex((current) => current === null ? null : (current - 1 + images.length) % images.length)
      if (event.key === 'ArrowRight') setSelectedIndex((current) => current === null ? null : (current + 1) % images.length)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [selectedIndex, images.length])

  if (!images.length) {
    return (
      <section id="gallery" className="xclue-dashboard-card scroll-mt-24 rounded-2xl border border-white/10 bg-black/50 p-5 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-white/60" /><h2 className="text-base font-medium">Gallery</h2></div>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">10 slots</span>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 text-sm text-white/40">
          Add image paths to <span className="font-mono text-white/60">gallery</span> in <span className="font-mono text-white/60">members.json</span>.
        </div>
      </section>
    )
  }

  const selectedImage = selectedIndex === null ? null : images[selectedIndex]

  return (
    <>
      <section id="gallery" className="xclue-dashboard-card scroll-mt-24 rounded-2xl border border-white/10 bg-black/50 p-5 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-white/60" /><h2 className="text-base font-medium">Gallery</h2></div>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">{images.length}/10</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.025] text-left outline-none transition hover:border-white/25 focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label={`Open ${member.name} gallery image ${index + 1}`}
            >
              <img
                src={src}
                alt={`${member.name} gallery ${index + 1}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.opacity = '0'
                  e.currentTarget.parentElement?.classList.add('bg-white/[0.04]')
                }}
              />
              <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[9px] text-white/55">{index + 1}</span>
            </button>
          ))}
        </div>
      </section>

      {selectedImage && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${member.name} gallery viewer`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedIndex(null)
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedIndex(null)}
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/60 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close gallery"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setSelectedIndex((selectedIndex - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/60 text-white/80 transition hover:bg-white/10 hover:text-white sm:left-6"
                aria-label="Previous image"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedIndex((selectedIndex + 1) % images.length)}
                className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/60 text-white/80 transition hover:bg-white/10 hover:text-white sm:right-6"
                aria-label="Next image"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div className="relative flex max-h-[92vh] max-w-[94vw] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl sm:max-w-[90vw]">
            <img
              src={selectedImage}
              alt={`${member.name} gallery ${selectedIndex + 1}`}
              className="max-h-[88vh] max-w-[90vw] object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function ProfileView({
  member,
  views,
}: {
  member: Member
  views: number
}) {
  const [entered, setEntered] = useState(false)
  const [startSignal, setStartSignal] = useState(0)
  const [viewCount, setViewCount] = useState(views)
  const [activeSection, setActiveSection] = useState('profile')
  const [recentActivities, setRecentActivities] = useState<StoredRecentActivity[]>([])
  const { data } = useLanyard(member.discordId)
  const liveBanner = useDiscordBanner(member.discordId)
  const banner = liveBanner ?? member.banner ?? `/banner/${member.profilePath}.gif`
  const status = data?.discord_status ?? 'offline'
  const custom = customStatus(data)
  const customEmoji = emojiImageUrl(custom?.emoji)
  const name = displayName(data) ?? member.name
  const userHandle = handle(data) ?? member.username
  const roleMeta = getRoleMeta(member.role)
  const games = playingGames(data)
  const socials = member.socials ?? {}
  const background = backgroundSrc(member.background || member.gifUrl)
  const fallbackAvatar = member.avatar || `/profile/${member.profilePath}.png`

  useEffect(() => {
    const avatar = data?.discord_user?.avatar
    if (!avatar || !member.discordId) return
    const ext = avatar.startsWith('a_') ? 'gif' : 'png'
    const href = `https://cdn.discordapp.com/avatars/${member.discordId}/${avatar}.${ext}?size=64`
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = href
  }, [data?.discord_user?.avatar, member.discordId])

  const enterProfile = () => {
    if (entered) return
    window.dispatchEvent(new Event('xclue:music-start'))
    setEntered(true)
    setStartSignal(Date.now())
  }

  useEffect(() => {
    if (!entered) return
    let cancelled = false
    fetch(`/api/profile-view/${encodeURIComponent(member.discordId)}`, { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled && typeof j?.views === 'number') setViewCount(j.views) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [entered, member.discordId])

  useEffect(() => {
    if (!entered) return

    let cancelled = false
    let timer: number | undefined

    const syncRecentActivity = async () => {
      try {
        const activities = (data?.activities ?? [])
          .filter((activity) => activity.type !== 4)
          .slice(0, 8)
          .map((activity) => ({
            activityKey: `${activity.id}:${activity.application_id ?? ''}:${activity.name}`,
            type: activity.type,
            name: activity.name,
            details: activity.details ?? null,
            state: activity.state ?? null,
            image: activityImage(activity),
            startedAt: activity.timestamps?.start ?? Date.now(),
          }))

        const response = await fetch(`/api/recent-activity/${encodeURIComponent(member.discordId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activities }),
          cache: 'no-store',
        })
        const json = await response.json().catch(() => null)
        if (!cancelled && response.ok && Array.isArray(json?.activities)) {
          setRecentActivities(json.activities.map((activity: StoredRecentActivity) => ({
            ...activity,
            startedAt: Number(activity.startedAt),
          })))
        }
      } catch {
        // The live Discord panel still works if the optional history sync fails.
      }
    }

    void syncRecentActivity()
    timer = window.setInterval(syncRecentActivity, 10_000)
    return () => {
      cancelled = true
      if (timer) window.clearInterval(timer)
    }
  }, [entered, member.discordId, data?.activities])

  useEffect(() => {
    if (!entered) return
    const sections = DASHBOARD_SECTIONS.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    if (!sections.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target?.id) setActiveSection(visible.target.id)
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.1, 0.35, 0.6] },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [entered])

  const selectSection = (id: string) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="xclue-dashboard relative min-h-dvh overflow-hidden bg-black text-white">
      <AmbientEffects />
      {background && <div aria-hidden className="pointer-events-none fixed inset-0 z-0"><img src={background} alt="" className="h-full w-full object-cover opacity-45" onError={(e) => { e.currentTarget.style.display = 'none' }} /><div className="absolute inset-0 bg-black/65" /><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,transparent_0%,rgba(0,0,0,.2)_38%,rgba(0,0,0,.88)_100%)]" /></div>}

      {!entered && (
        <button type="button" aria-label={`Enter ${member.name}'s profile`} onClick={enterProfile} className="fixed inset-0 z-50 grid cursor-pointer place-items-center overflow-hidden bg-black/65 p-4 backdrop-blur-sm">
          {banner && <img src={banner} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
          <div className="pointer-events-none absolute inset-0 bg-black/55" />
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black/75 shadow-2xl backdrop-blur-xl">
            <div className="relative h-28 overflow-hidden"><img src={banner} alt="" className="h-full w-full object-cover opacity-60" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none' }} /><div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" /></div>
            <div className="-mt-10 flex flex-col items-center px-6 pb-7 text-center">
              <div className="relative"><DiscordAvatar data={data} name={member.name} fallbackSrc={fallbackAvatar} size={82} /><StatusDot status={status} className="absolute bottom-1 right-1 h-4 w-4" /></div>
              <h1 className="mt-3 text-xl font-bold">{name}</h1>
              <p className="font-mono text-xs text-white/45"><AnimatedHandle handleValue={userHandle} /></p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white text-sm font-semibold text-black px-5 py-2.5"><Sparkles className="h-4 w-4" />Enter profile →</span>
              <p className="mt-4 font-mono text-[10px] text-white/35">Click anywhere · press Enter</p>
            </div>
          </div>
        </button>
      )}

      <div className={entered ? 'relative z-10' : 'pointer-events-none relative z-0 opacity-0'}>
        <div className="relative mx-auto grid w-full max-w-[1480px] grid-cols-1 items-start gap-5 px-4 pb-8 pt-6 sm:px-6 xl:grid-cols-[260px_minmax(0,1fr)_260px] xl:px-5">
          <SidebarNav member={member} name={name} status={status} data={data} activeSection={activeSection} onSelect={selectSection} />

          <div className="min-w-0">
            <section id="profile" className="xclue-hero-panel scroll-mt-24 relative min-h-[480px] overflow-hidden rounded-3xl border border-white/[0.06] bg-black/10 px-5 pb-6 pt-28 sm:px-9">
              {banner && <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />
              <div className="relative z-10 flex min-h-[390px] flex-col justify-end">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-col items-start">
                      <div className="mb-3 flex w-[104px] justify-center">
                        <span className="inline-flex min-h-7 items-center justify-center whitespace-nowrap rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80">♔ {roleMeta.label}</span>
                      </div>
                      <div className="flex items-end gap-5">
                        <div className="relative shrink-0"><DiscordAvatar data={data} name={member.name} fallbackSrc={fallbackAvatar} size={104} /><StatusDot status={status} className="absolute bottom-1.5 right-1.5 h-5 w-5" /></div>
                        <div className="min-w-0 pb-1">
                          <h1 className="truncate text-4xl font-semibold tracking-tight sm:text-5xl">{name}</h1>
                          <p className="mt-1 font-mono text-base text-white/55"><AnimatedHandle handleValue={userHandle} /></p>
                        </div>
                      </div>
                    </div>
                    {(custom?.text || member.bio) && <div className="mt-5 max-w-xl space-y-2">
                      {custom?.text && <p className="flex items-center gap-2 text-sm text-white/70">{customEmoji ? <Image src={customEmoji} alt="" width={16} height={16} unoptimized className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-white/60" />}{custom.text}</p>}
                      {member.bio && <p className="text-sm text-white/45">{member.bio}</p>}
                    </div>}
                    <div id="socials" className="mt-6 scroll-mt-24 flex flex-wrap items-center gap-4 text-white/65">
                      {member.discordId && <a href={socialHref('discord', member.discordId)} target="_blank" rel="noreferrer" title="Discord"><DiscordIcon className="h-5 w-5 hover:text-white" /></a>}
                      {socials.instagram && <a href={socialHref('instagram', socials.instagram)} target="_blank" rel="noreferrer" title="Instagram"><span className="text-xl hover:text-white">◎</span></a>}
                      {socials.youtube && <a href={socialHref('youtube', socials.youtube)} target="_blank" rel="noreferrer" title="YouTube"><YoutubeIcon className="h-5 w-5 hover:text-white" /></a>}
                      {socials.tiktok && <a href={socialHref('tiktok', socials.tiktok)} target="_blank" rel="noreferrer" title="TikTok"><TikTokIcon className="h-5 w-5 hover:text-white" /></a>}
                      {socials.spotify && <a href={socialHref('spotify', socials.spotify)} target="_blank" rel="noreferrer" title="Spotify"><SpotifyIcon className="h-5 w-5 hover:text-white" /></a>}
                      {socials.kick && <a href={socialHref('kick', socials.kick)} target="_blank" rel="noreferrer" title="Kick"><KickIcon className="grid h-5 w-5 place-items-center text-xs font-black hover:text-white" /></a>}
                      {socials.twitch && <a href={socialHref('twitch', socials.twitch)} target="_blank" rel="noreferrer" title="Twitch"><TwitchIcon className="grid h-5 w-5 place-items-center text-xs font-black hover:text-white" /></a>}
                    </div>
                  </div>
                  <div id="view-count" className="grid shrink-0 scroll-mt-24 grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
                    <div className="px-5 py-3"><p className="text-lg font-semibold tabular-nums">{viewCount.toLocaleString()}</p><p className="text-[10px] uppercase tracking-wider text-white/35">Views</p></div>
                    <div className="border-x border-white/10 px-5 py-3"><p className={`flex items-center gap-2 text-lg font-semibold ${statusTextClass(status as any)}`}><span className={`h-2.5 w-2.5 rounded-full ${statusColorClass(status as any)}`} />{statusLabel(status as any)}</p><p className="text-[10px] uppercase tracking-wider text-white/35">Status</p></div>
                    <div className="px-5 py-3"><p className="text-lg font-semibold">{games.length || 0}</p><p className="text-[10px] uppercase tracking-wider text-white/35">Activities</p></div>
                  </div>
                </div>
              </div>
            </section>

            {member.youtubeUrl && <section className="mt-5"><MusicPlayer youtubeUrl={member.youtubeUrl} startSignal={startSignal} /></section>}
            <div className="mt-5"><SetupStrip member={member} /></div>
            <GalleryPanel member={member} />
          </div>

          <aside className="min-w-0 space-y-5 xl:pt-0">
            <NewUploadPanel discordId={member.discordId} />
            <section id="activity" className="xclue-dashboard-card overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-xl scroll-mt-24">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-medium">Currently Playing</h2><Gamepad2 className="h-4 w-4 text-white/35" /></div>
              <GamesPanel data={data} />
            </section>
            <RecentActivityPanel activities={recentActivities} name={name} />
            {background && <div className="relative h-48 overflow-hidden rounded-2xl border border-white/10 bg-black/50"><img src={background} alt="" className="h-full w-full object-cover opacity-60" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" /><div className="absolute bottom-3 left-4 right-4 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">XCLUE</span><ArrowUpRight className="h-4 w-4 text-white/40" /></div></div>}
          </aside>
        </div>
      </div>
    </main>
  )
}
