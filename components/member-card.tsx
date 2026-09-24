'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Member } from '@/lib/members'
import { useLanyard } from '@/hooks/use-lanyard'
import { useDiscordBanner } from '@/hooks/use-discord-banner'
import {
  customStatus,
  displayName,
  emojiImageUrl,
  handle,
  playingGames,
  statusLabel,
} from '@/lib/lanyard'
import { DiscordAvatar } from '@/components/discord-avatar'
import { StatusDot } from '@/components/status-badge'

export function MemberCard({ member }: { member: Member }) {
  const { data } = useLanyard(member.discordId)
  const liveBanner = useDiscordBanner(member.discordId)
  const banner = liveBanner ?? member.banner
  const status = data?.discord_status ?? 'offline'
  const custom = customStatus(data)
  const customEmoji = emojiImageUrl(custom?.emoji)
  const name = displayName(data) ?? member.name
  const userHandle = handle(data) ?? member.username
  const games = playingGames(data)
  const game = games[0]

  return (
    <Link
      href={`/${member.profilePath}`}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card/50 transition duration-300 hover:border-gold/50 hover:shadow-[0_0_30px_-10px_var(--gold)]"
    >
      {/* banner */}
      <div className="relative h-20 w-full overflow-hidden bg-gradient-to-br from-gold/10 via-black to-black">
        {banner && (
          <Image
            src={banner || '/placeholder.svg'}
            alt=""
            fill
            unoptimized
            className="object-cover opacity-80 transition duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
      </div>

      <div className="px-4 pb-4">
        <div className="-mt-8 flex items-end justify-between">
          <div className="relative">
            <DiscordAvatar data={data} name={name} size={56} />
            <StatusDot
              status={status}
              className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5"
            />
          </div>
          <span className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {statusLabel(status)}
          </span>
        </div>

        <div className="mt-2">
          <p className="truncate font-semibold text-foreground">{name}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {userHandle}
          </p>
        </div>

        <p className="mt-2 flex min-h-4 items-center gap-1 text-xs text-muted-foreground">
          {customEmoji && (
            <Image
              src={customEmoji || '/placeholder.svg'}
              alt=""
              width={14}
              height={14}
              unoptimized
              className="inline-block h-3.5 w-3.5 shrink-0"
            />
          )}
          <span className="truncate">
            {custom?.text ||
              (game ? `Playing ${game.name}` : member.bio || '\u00A0')}
          </span>
        </p>
      </div>
    </Link>
  )
}
