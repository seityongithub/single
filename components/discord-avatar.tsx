'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { LanyardData } from '@/lib/lanyard'
import { avatarUrl, avatarDecorationUrl } from '@/lib/lanyard'

export function DiscordAvatar({
  data,
  name,
  fallbackSrc,
  size = 96,
  className,
}: {
  data?: LanyardData
  name: string
  /** Optional member-configured local/remote fallback. Live Discord avatar wins. */
  fallbackSrc?: string
  size?: number
  className?: string
}) {
  const url = avatarUrl(data)
  const decoration = avatarDecorationUrl(data)
  const initial = name.charAt(0).toUpperCase()
  const fallback = fallbackSrc || ''
  const [imageSrc, setImageSrc] = useState<string | null>(url || fallback || null)

  useEffect(() => {
    setImageSrc(url || fallback || null)
  }, [url, fallback])

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={cn(
          'relative h-full w-full overflow-hidden rounded-full border-2 border-gold/40 bg-black',
          className,
        )}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={name}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => {
              if (url && fallback && imageSrc === url) {
                setImageSrc(fallback)
              } else {
                setImageSrc(null)
              }
            }}
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-gold/20 to-black font-sans text-2xl font-bold text-gold">
            {initial}
          </div>
        )}
      </div>

      {decoration && (
        <img
          src={decoration}
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 select-none"
          style={{ width: size * 1.28, height: size * 1.28, maxWidth: 'none' }}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  )
}
