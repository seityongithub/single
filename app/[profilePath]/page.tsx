import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getMemberByProfilePath, MEMBERS } from '@/lib/members'
import { getProfileViews } from '@/lib/db'
import { ProfileView } from '@/components/profile-view'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return MEMBERS.map((member) => ({ profilePath: member.profilePath }))
}

export async function generateMetadata({ params }: { params: Promise<{ profilePath: string }> }): Promise<Metadata> {
  const { profilePath } = await params
  const member = getMemberByProfilePath(profilePath)
  if (!member) return { title: 'Profile' }
  return {
    title: `${member.name}`,
    description: `${member.name} — Bio`,
  }
}

export default async function MemberProfile({ params }: { params: Promise<{ profilePath: string }> }) {
  const { profilePath } = await params
  const member = getMemberByProfilePath(profilePath)
  if (!member) return notFound()

  const views = await getProfileViews(member.discordId)
  return <ProfileView member={member} views={views} />
}
