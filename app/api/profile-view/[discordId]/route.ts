import { NextResponse } from 'next/server'
import { getMemberByDiscordId } from '@/lib/members'
import { getProfileViews, hasDatabaseConnection, incrementProfileViews } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ discordId: string }> },
) {
  const { discordId } = await params
  const member = getMemberByDiscordId(discordId)

  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (!hasDatabaseConnection()) {
    return NextResponse.json({ views: 0, databaseConfigured: false }, { status: 200 })
  }

  return NextResponse.json({ views: await getProfileViews(discordId), databaseConfigured: true })
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ discordId: string }> },
) {
  const { discordId } = await params
  const member = getMemberByDiscordId(discordId)

  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (!hasDatabaseConnection()) {
    return NextResponse.json(
      { error: 'Database is not configured. Add DATABASE_URL to .env.local / Vercel.', views: 0, databaseConfigured: false },
      { status: 503 },
    )
  }

  try {
    const views = await incrementProfileViews(discordId)
    return NextResponse.json({ views, databaseConfigured: true })
  } catch (error) {
    console.error('[xclue] incrementProfileViews failed:', error)
    return NextResponse.json(
      { error: 'Could not update profile views. Check the Neon connection.', views: 0, databaseConfigured: true },
      { status: 500 },
    )
  }
}
