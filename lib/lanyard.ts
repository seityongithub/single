export type DiscordStatus = 'online' | 'idle' | 'dnd' | 'offline'

export interface LanyardEmoji {
  name?: string
  id?: string
  animated?: boolean
}

export interface LanyardActivity {
  id: string
  name: string
  type: number // 0 = playing, 2 = listening, 4 = custom status
  state?: string
  details?: string
  application_id?: string
  timestamps?: { start?: number; end?: number }
  assets?: {
    large_image?: string
    large_text?: string
    small_image?: string
    small_text?: string
  }
  emoji?: LanyardEmoji
}

export interface LanyardData {
  discord_status: DiscordStatus
  activities: LanyardActivity[]
  listening_to_spotify: boolean
  spotify?: {
    song: string
    artist: string
    album_art_url: string
  } | null
  discord_user: {
    id: string
    username: string
    global_name?: string | null
    display_name?: string | null
    avatar?: string | null
    discriminator?: string
    avatar_decoration_data?: {
      asset: string
      sku_id?: string
    } | null
  }
}

export interface LanyardResponse {
  success: boolean
  data?: LanyardData
}

const STATUS_LABEL: Record<DiscordStatus, string> = {
  online: 'Online',
  idle: 'Away',
  dnd: 'Do Not Disturb',
  offline: 'Offline',
}

export function statusLabel(status: DiscordStatus): string {
  return STATUS_LABEL[status]
}

export function statusColorClass(status: DiscordStatus): string {
  switch (status) {
    case 'online': return 'bg-[#23a55a]'
    case 'idle': return 'bg-[#f0b232]'
    case 'dnd': return 'bg-[#f23f42]'
    default: return 'bg-[#80848e]'
  }
}

export function statusTextClass(status: DiscordStatus): string {
  switch (status) {
    case 'online': return 'text-[#23a55a]'
    case 'idle': return 'text-[#f0b232]'
    case 'dnd': return 'text-[#f23f42]'
    default: return 'text-[#80848e]'
  }
}

/** Real Discord display name (global name), falling back to username. */
export function displayName(data?: LanyardData): string | null {
  const u = data?.discord_user
  if (!u) return null
  return u.global_name || u.display_name || u.username || null
}

/** @handle — the Discord username. */
export function handle(data?: LanyardData): string | null {
  const username = data?.discord_user?.username
  return username ? `@${username}` : null
}

export function avatarUrl(data?: LanyardData): string | null {
  if (!data?.discord_user?.avatar) return null
  const { id, avatar } = data.discord_user
  const ext = avatar.startsWith('a_') ? 'gif' : 'png'
  return `https://cdn.discordapp.com/avatars/${id}/${avatar}.${ext}?size=256`
}

export function avatarDecorationUrl(data?: LanyardData): string | null {
  const asset = data?.discord_user?.avatar_decoration_data?.asset
  if (!asset) return null
  return `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png?size=160`
}

export function customStatus(data?: LanyardData): {
  text: string
  emoji?: LanyardEmoji
} | null {
  const activity = data?.activities?.find((a) => a.type === 4)
  if (!activity) return null
  const text = activity.state ?? ''
  if (!text && !activity.emoji?.name) return null
  return { text, emoji: activity.emoji }
}

export function emojiImageUrl(emoji?: LanyardEmoji): string | null {
  if (!emoji?.id) return null
  const ext = emoji.animated ? 'gif' : 'png'
  return `https://cdn.discordapp.com/emojis/${emoji.id}.${ext}?size=32`
}


export function playingGames(data?: LanyardData): LanyardActivity[] {
  return data?.activities?.filter((a) => a.type === 0) ?? []
}

export interface SpotifyInfo {
  song: string
  artist: string
  albumArt: string | null
  start?: number
  end?: number
}

export function spotifyNowPlaying(data?: LanyardData): SpotifyInfo | null {
  if (!data?.listening_to_spotify || !data.spotify) return null
  const activity = data.activities?.find((a) => a.type === 2)
  return {
    song: data.spotify.song,
    artist: data.spotify.artist,
    albumArt: data.spotify.album_art_url ?? null,
    start: activity?.timestamps?.start,
    end: activity?.timestamps?.end,
  }
}

export function activityImage(activity: LanyardActivity): string | null {
  const img = activity.assets?.large_image
  if (!img) return null
  if (img.startsWith('mp:external/')) {
    return `https://media.discordapp.net/${img.replace('mp:', '')}`
  }
  if (activity.application_id) {
    return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${img}.png`
  }
  return null
}
