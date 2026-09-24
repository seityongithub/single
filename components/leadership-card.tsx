'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Member } from '@/lib/members'
import { useLanyard } from '@/hooks/use-lanyard'
import { avatarUrl, customStatus, displayName, handle, playingGames, statusLabel } from '@/lib/lanyard'
import { StatusDot } from '@/components/status-badge'

export function LeadershipCard({ member }: { member: Member }) {
  const { data } = useLanyard(member.discordId)
  const name = displayName(data) ?? member.name
  const userHandle = handle(data) ?? member.username
  const avatar = avatarUrl(data)
  const status = data?.discord_status ?? 'offline'
  const custom = customStatus(data)
  const game = playingGames(data)[0]

  return (
    <Link
      href={`/${member.profilePath}`}
      className="group relative isolate block overflow-hidden rounded-[1.35rem] border border-gold/25 bg-black/70 transition duration-300 hover:-translate-y-1 hover:border-gold/65"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(212,175,55,0.16),transparent_55%)]" />
      <div className="relative aspect-[4/5] overflow-hidden">
        {avatar ? (
          <Image
            src={avatar}
            alt={name}
            fill
            unoptimized
            sizes="(max-width: 640px) 90vw, 280px"
            className="object-cover object-center grayscale-[15%] transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-gold/20 via-black to-black text-5xl font-bold text-gold/80">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full border border-gold/30 bg-black/65 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-gold backdrop-blur-md">
          {member.role === 'EXCLUE_GIRLS' ? 'Featured XCLUE' : member.role.replace('_', ' ')}
        </div>
        <StatusDot status={status} className="absolute right-4 top-4 h-3.5 w-3.5 border-2 border-black" />

        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold/85">{statusLabel(status)}</p>
          <h3 className="mt-1 text-2xl font-bold tracking-wide text-white">{name}</h3>
          <p className="font-mono text-xs text-white/55">{userHandle}</p>
          <p className="mt-3 min-h-4 truncate text-xs text-white/65">
            {custom?.text || (game ? `Playing ${game.name}` : member.bio || 'XCLUE')}
          </p>
        </div>
      </div>
    </Link>
  )
}
