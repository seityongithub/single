import { neon } from '@neondatabase/serverless'

// Support the common Neon/Vercel variable names. DATABASE_URL remains the
// preferred name, while the aliases make the profile counter less fragile.
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  ''

const sql = databaseUrl ? neon(databaseUrl) : null

export type StoredRecentActivity = {
  activityKey: string
  type: number
  name: string
  details?: string | null
  state?: string | null
  image?: string | null
  startedAt: number
  lastSeenAt: string
}

async function ensureProfileViewsSchema() {
  if (!sql) return

  await sql`
    CREATE TABLE IF NOT EXISTS profile_views (
      discord_id text PRIMARY KEY,
      views integer NOT NULL DEFAULT 0,
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `

  // Keep compatibility with an older XCLUE profile_views table if it already
  // exists in the Neon database.
  await sql`ALTER TABLE profile_views ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0`
  await sql`ALTER TABLE profile_views ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now()`
  await sql`ALTER TABLE profile_views ADD COLUMN IF NOT EXISTS discord_id text`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS profile_views_discord_id_unique ON profile_views (discord_id)`
}

async function ensureRecentActivitySchema() {
  if (!sql) return

  await sql`
    CREATE TABLE IF NOT EXISTS recent_activities (
      discord_id text NOT NULL,
      activity_key text NOT NULL,
      activity_type integer NOT NULL,
      name text NOT NULL,
      details text,
      state text,
      image text,
      started_at bigint NOT NULL,
      last_seen_at timestamp NOT NULL DEFAULT now(),
      PRIMARY KEY (discord_id, activity_key)
    )
  `
}

export function hasDatabaseConnection(): boolean {
  return Boolean(sql)
}

export async function incrementProfileViews(discordId: string): Promise<number> {
  if (!sql) throw new Error('DATABASE_URL is not configured')

  await ensureProfileViewsSchema()
  const rows = (await sql`
    INSERT INTO profile_views (discord_id, views, updated_at)
    VALUES (${discordId}, 1, now())
    ON CONFLICT (discord_id)
    DO UPDATE SET views = profile_views.views + 1, updated_at = now()
    RETURNING views
  `) as { views: number }[]

  return rows[0]?.views ?? 0
}

export async function getProfileViews(discordId: string): Promise<number> {
  if (!sql) return 0

  try {
    await ensureProfileViewsSchema()
    const rows = (await sql`
      SELECT views FROM profile_views WHERE discord_id = ${discordId}
    `) as { views: number }[]

    return rows[0]?.views ?? 0
  } catch (err) {
    console.error('[xclue] getProfileViews failed:', (err as Error).message)
    return 0
  }
}

type RecentActivityInput = Omit<StoredRecentActivity, 'lastSeenAt'>

export async function syncRecentActivities(
  discordId: string,
  activities: RecentActivityInput[],
): Promise<StoredRecentActivity[]> {
  if (!sql) return []

  await ensureRecentActivitySchema()

  // Keep each activity for six hours after we last saw it. This means a
  // finished game/song remains in Recent Activity for six hours instead of
  // disappearing as soon as it stops, while a long-running activity stays
  // visible because its last_seen_at is refreshed on every sync.

  for (const activity of activities) {
    const startedAt = Number.isFinite(activity.startedAt) && activity.startedAt > 0
      ? activity.startedAt
      : Date.now()

    await sql`
      INSERT INTO recent_activities (
        discord_id, activity_key, activity_type, name, details, state, image, started_at, last_seen_at
      )
      VALUES (
        ${discordId}, ${activity.activityKey}, ${activity.type}, ${activity.name},
        ${activity.details ?? null}, ${activity.state ?? null}, ${activity.image ?? null},
        ${startedAt}, now()
      )
      ON CONFLICT (discord_id, activity_key)
      DO UPDATE SET
        activity_type = EXCLUDED.activity_type,
        name = EXCLUDED.name,
        details = EXCLUDED.details,
        state = EXCLUDED.state,
        image = EXCLUDED.image,
        started_at = CASE
          WHEN recent_activities.started_at > 0 THEN recent_activities.started_at
          ELSE EXCLUDED.started_at
        END,
        last_seen_at = now()
    `
  }

  await sql`
    DELETE FROM recent_activities
    WHERE discord_id = ${discordId}
      AND last_seen_at < now() - interval '6 hours'
  `

  const rows = (await sql`
    SELECT
      activity_key AS "activityKey",
      activity_type AS "type",
      name,
      details,
      state,
      image,
      started_at AS "startedAt",
      last_seen_at AS "lastSeenAt"
    FROM recent_activities
    WHERE discord_id = ${discordId}
      AND last_seen_at >= now() - interval '6 hours'
    ORDER BY started_at DESC
    LIMIT 8
  `) as Array<Omit<StoredRecentActivity, 'startedAt'> & { startedAt: number | string }>

  return rows.map((row) => ({
    ...row,
    startedAt: Number(row.startedAt),
  }))
}
