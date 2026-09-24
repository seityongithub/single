import { NextResponse } from 'next/server'
import { getMemberByDiscordId } from '@/lib/members'
import { syncRecentActivities, type StoredRecentActivity } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALLOWED_TYPES = new Set([0, 2, 3, 5])

function cleanActivity(value: unknown): Omit<StoredRecentActivity, 'lastSeenAt'> | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const type = Number(raw.type)
  const name = String(raw.name ?? '').trim()
  if (!ALLOWED_TYPES.has(type) || !name) return null

  const timestamps = raw.timestamps && typeof raw.timestamps === 'object'
    ? raw.timestamps as Record<string, unknown>
    : null

  const startedAt = Number(timestamps?.start ?? 0)
  const activityKey = String(
    raw.activityKey ?? `${String(raw.id ?? name)}:${String(raw.applicationId ?? '')}:${name}`,
  ).slice(0, 300)

  return {
    activityKey,
    type,
    name: name.slice(0, 500),
    details: raw.details ? String(raw.details).slice(0, 1000) : null,
    state: raw.state ? String(raw.state).slice(0, 1000) : null,
    image: raw.image ? String(raw.image).slice(0, 2000) : null,
    startedAt: Number.isFinite(startedAt) && startedAt > 0 ? startedAt : Date.now(),
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ discordId: string }> },
) {
  const { discordId } = await params
  if (!/^\d{5,25}$/.test(discordId)) {
    return NextResponse.json({ error: 'Invalid Discord ID' }, { status: 400 })
  }
  if (!getMemberByDiscordId(discordId)) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const rawActivities = Array.isArray(body?.activities) ? body.activities : []
    const activities = rawActivities
      .map(cleanActivity)
      .filter((activity): activity is Omit<StoredRecentActivity, 'lastSeenAt'> => Boolean(activity))
      .slice(0, 8)

    const recent = await syncRecentActivities(discordId, activities)
    return NextResponse.json({ activities: recent })
  } catch (error) {
    console.error('[xclue] recent activity sync failed:', error)
    return NextResponse.json({ error: 'Recent activity sync failed' }, { status: 500 })
  }
}
