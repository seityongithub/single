import { NextResponse } from 'next/server'
import { getMemberByDiscordId } from '@/lib/members'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Upload lifecycle:
// 0–2 days old  -> NEW
// 2–4 days old  -> recent, but no longer NEW
// 4+ days old   -> removed
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000
const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000

type Upload = {
  platform: 'youtube' | 'tiktok'
  title: string
  url: string
  thumbnail?: string | null
  publishedAt?: string | null
  ageDays?: number | null
  fresh?: boolean
}

function cleanHandle(value?: string): string | null {
  if (!value) return null
  const raw = value.trim()
  if (!raw) return null

  if (/^@[A-Za-z0-9._-]+$/.test(raw)) return raw.slice(1)
  if (/^[A-Za-z0-9._-]+$/.test(raw)) return raw

  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    const segments = url.pathname.split('/').filter(Boolean)
    const handleSegment = segments.find((segment) => segment.startsWith('@'))
    if (handleSegment) return handleSegment.slice(1)

    const first = segments[0]?.toLowerCase()
    if (segments[0] && !['channel', 'user', 'c', 'videos', 'video', 'live'].includes(first)) {
      return segments[0].replace(/^@/, '')
    }
    if (segments[1] && ['channel', 'user', 'c'].includes(first)) {
      return segments[1].replace(/^@/, '')
    }
  } catch {
    // Fall through to the simple cleanup below.
  }

  return raw
    .replace(/^https?:\/\/[^/]+\//i, '')
    .replace(/^@/, '')
    .split(/[/?#]/)[0]
    .trim() || null
}

async function fetchText(url: string, headers: HeadersInit = {}): Promise<string | null> {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
        ...headers,
      },
    })
    return response.ok ? await response.text() : null
  } catch {
    return null
  }
}

function decodeHtml(value: string): string {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function extractYoutubeChannelId(html: string): string | null {
  const patterns = [
    /<meta[^>]+itemprop=["']channelId["'][^>]+content=["'](UC[\w-]{20,})["']/i,
    /<meta[^>]+content=["'](UC[\w-]{20,})["'][^>]+itemprop=["']channelId["']/i,
    /["']channelId["']\s*[:=]\s*["'](UC[\w-]{20,})["']/i,
    /["']externalId["']\s*[:=]\s*["'](UC[\w-]{20,})["']/i,
    /https?:\\?\/\\?\/www\.youtube\.com\\?\/channel\\?\/(UC[\w-]{20,})/i,
    /youtube\.com\/channel\/(UC[\w-]{20,})/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

function withAge(upload: Upload): Upload | null {
  if (!upload.publishedAt) return null
  const published = Date.parse(upload.publishedAt)
  if (!Number.isFinite(published)) return null

  const ageMs = Date.now() - published
  if (ageMs > FOUR_DAYS_MS) return null

  const ageDays = Math.max(0, ageMs) / 86_400_000
  return {
    ...upload,
    ageDays,
    fresh: ageMs <= TWO_DAYS_MS,
  }
}

function parseXmlEntries(feed: string): Upload[] {
  const uploads: Upload[] = []
  for (const match of feed.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)) {
    const entry = match[1]
    const getTag = (tag: string) =>
      entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))?.[1]

    const videoId = getTag('yt:videoId')?.trim()
    const title = getTag('title') ? decodeHtml(getTag('title')!) : ''
    const publishedAt = getTag('published')?.trim() ?? getTag('updated')?.trim() ?? null
    if (!videoId || !title || !publishedAt) continue

    const upload = withAge({
      platform: 'youtube',
      title,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      publishedAt,
    })
    if (upload) uploads.push(upload)
  }
  return uploads
}

async function getYouTubeUpload(handleValue?: string): Promise<Upload | null> {
  const raw = handleValue?.trim()
  if (!raw) return null

  try {
    const directChannelId = raw.match(/(?:youtube\.com\/channel\/|^)(UC[\w-]{20,})/i)?.[1] ?? null
    const handle = cleanHandle(raw)
    if (!handle && !directChannelId) return null

    let channelId = directChannelId
    if (!channelId) {
      // /videos tends to expose the channel metadata even when the normal
      // channel landing page is rendered differently.
      const urls = [
        `https://www.youtube.com/@${encodeURIComponent(handle as string)}/videos`,
        `https://www.youtube.com/@${encodeURIComponent(handle as string)}`,
      ]

      for (const profileUrl of urls) {
        const html = await fetchText(profileUrl, { accept: 'text/html,application/xhtml+xml' })
        if (!html) continue
        channelId = extractYoutubeChannelId(html)
        if (channelId) break
      }
    }

    if (!channelId) return null

    const feed = await fetchText(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
      { accept: 'application/atom+xml, application/xml, text/xml' },
    )
    if (!feed) return null

    // Check every feed entry in the retention window instead of assuming the
    // first entry is usable. This also handles a pinned/odd feed response.
    return parseXmlEntries(feed)
      .sort((a, b) => Date.parse(String(b.publishedAt)) - Date.parse(String(a.publishedAt)))[0] ?? null
  } catch {
    return null
  }
}

function inferredTikTokTime(id: string): number {
  if (!/^\d{8,}$/.test(id)) return 0
  const numeric = Number(id)
  if (!Number.isSafeInteger(numeric)) return 0
  const seconds = Math.floor(numeric / 4294967296)
  // Reject clearly invalid timestamps rather than accidentally displaying an
  // ancient/future item from an unrelated numeric field.
  const now = Math.floor(Date.now() / 1000)
  if (seconds < 1_500_000_000 || seconds > now + 86_400) return 0
  return seconds
}

function collectTikTokCandidates(value: unknown, out: Upload[], seen: Set<object>, handle: string) {
  if (!value || typeof value !== 'object' || out.length >= 5000) return
  const object = value as object
  if (seen.has(object)) return
  seen.add(object)

  const obj = value as Record<string, unknown>
  const video = obj.video && typeof obj.video === 'object' ? (obj.video as Record<string, unknown>) : null
  const id = String(obj.id ?? obj.aweme_id ?? obj.itemId ?? '')
  const title = String(obj.desc ?? obj.description ?? obj.title ?? '')
  const explicitCreateTime = Number(obj.createTime ?? obj.create_time ?? 0)
  const inferredCreateTime = inferredTikTokTime(id)
  const createTime = explicitCreateTime > 0 ? explicitCreateTime : inferredCreateTime

  if (/^\d{8,}$/.test(id) && createTime > 0) {
    const cover = video?.cover ?? video?.originCover ?? video?.dynamicCover ?? video?.coverUrl
    out.push({
      platform: 'tiktok',
      title: title || 'TikTok upload',
      url: `https://www.tiktok.com/@${handle}/video/${id}`,
      thumbnail: typeof cover === 'string' ? cover : null,
      publishedAt: new Date(createTime * 1000).toISOString(),
    })
  }

  for (const child of Object.values(obj)) {
    collectTikTokCandidates(child, out, seen, handle)
    if (out.length >= 5000) break
  }
}

function parseTikTokVideoIds(html: string): string[] {
  const ids = new Set<string>()
  const patterns = [
    /(?:\/video\/|["']videoId["']\s*:\s*["'])(\d{8,})/g,
    /["']aweme_id["']\s*[:=]\s*["']?(\d{8,})/g,
  ]
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      if (match[1]) ids.add(match[1])
    }
  }
  return [...ids]
}

function extractTikTokCreateTime(html: string, id: string): number {
  // When TikTok emits createTime beside the item id, use it before falling
  // back to the Snowflake timestamp encoded in the video id.
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const nearby = new RegExp(
    `(?:["'](?:id|aweme_id|itemId)["']\\s*[:=]\\s*["']${escapedId}["'][\\s\\S]{0,1800}?["'](?:createTime|create_time)["']\\s*[:=]\\s*["']?(\\d{9,12})|["'](?:createTime|create_time)["']\\s*[:=]\\s*["']?(\\d{9,12})[\\s\\S]{0,1800}?["'](?:id|aweme_id|itemId)["']\\s*[:=]\\s*["']${escapedId}["'])`,
    'i',
  )
  const match = html.match(nearby)
  return Number(match?.[1] ?? match?.[2] ?? 0)
}

async function tiktokOembed(url: string): Promise<{ title: string; thumbnail?: string | null } | null> {
  try {
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      cache: 'no-store',
      headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0' },
    })
    if (!response.ok) return null
    const json = await response.json()
    return typeof json?.title === 'string'
      ? { title: json.title, thumbnail: typeof json.thumbnail_url === 'string' ? json.thumbnail_url : null }
      : null
  } catch {
    return null
  }
}

async function getTikTokUpload(handleValue?: string): Promise<Upload | null> {
  const handle = cleanHandle(handleValue)
  if (!handle) return null

  try {
    const profileUrl = `https://www.tiktok.com/@${encodeURIComponent(handle)}`
    const html = await fetchText(profileUrl, { accept: 'text/html,application/xhtml+xml' })
    if (!html) return null

    const candidates: Upload[] = []
    const scriptIds = [
      '__UNIVERSAL_DATA_FOR_REHYDRATION__',
      'SIGI_STATE',
      '__NEXT_DATA__',
      '__UNIVERSAL_DATA_FOR_REHYDRATION__',
    ]

    for (const scriptId of scriptIds) {
      const script = html.match(
        new RegExp(`<script[^>]+id=["']${scriptId}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'i'),
      )?.[1]
      if (!script) continue
      try {
        collectTikTokCandidates(JSON.parse(script), candidates, new Set<object>(), handle)
      } catch {
        // Some TikTok responses escape/transform the JSON. Raw HTML parsing
        // below is the fallback for those responses.
      }
    }

    // Raw HTML fallback: TikTok frequently keeps video IDs in markup even
    // when its structured hydration payload is unavailable.
    const ids = parseTikTokVideoIds(html)
    for (const id of ids.slice(0, 20)) {
      const createTime = extractTikTokCreateTime(html, id) || inferredTikTokTime(id)
      if (!createTime) continue
      candidates.push({
        platform: 'tiktok',
        title: 'TikTok upload',
        url: `https://www.tiktok.com/@${handle}/video/${id}`,
        thumbnail: null,
        publishedAt: new Date(createTime * 1000).toISOString(),
      })
    }

    const unique = new Map<string, Upload>()
    for (const candidate of candidates) {
      const upload = withAge(candidate)
      if (upload) {
        const existing = unique.get(upload.url)
        // Prefer the structured candidate because it usually has the real
        // title/thumbnail rather than the raw-HTML fallback values.
        if (!existing || existing.title === 'TikTok upload') unique.set(upload.url, upload)
      }
    }

    const sorted = [...unique.values()].sort(
      (a, b) => Date.parse(String(b.publishedAt)) - Date.parse(String(a.publishedAt)),
    )
    if (sorted[0]) {
      // Fill in a missing title/thumbnail through oEmbed without changing the
      // upload timestamp used for the 4-day retention rule.
      if (sorted[0].title === 'TikTok upload' || !sorted[0].thumbnail) {
        const meta = await tiktokOembed(sorted[0].url)
        if (meta) {
          sorted[0] = { ...sorted[0], title: meta.title || sorted[0].title, thumbnail: meta.thumbnail ?? sorted[0].thumbnail }
        }
      }
      return sorted[0]
    }

    return null
  } catch {
    return null
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ discordId: string }> },
) {
  const { discordId } = await params
  if (!/^\d{5,25}$/.test(discordId)) {
    return NextResponse.json({ upload: null, uploads: [] }, { status: 400 })
  }

  const member = getMemberByDiscordId(discordId)
  if (!member) return NextResponse.json({ upload: null, uploads: [] }, { status: 404 })

  const [youtube, tiktok] = await Promise.all([
    getYouTubeUpload(member.socials?.youtube),
    getTikTokUpload(member.socials?.tiktok),
  ])

  const uploads = [youtube, tiktok]
    .filter(Boolean)
    .sort((a, b) => Date.parse(String(b?.publishedAt)) - Date.parse(String(a?.publishedAt))) as Upload[]

  return NextResponse.json(
    {
      upload: uploads[0] ?? null,
      uploads,
      retention: { freshDays: 2, removeAfterDays: 4 },
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
}
