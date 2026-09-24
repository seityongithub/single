// ============================================================================
// XCLUE MEMBER REGISTRY
// ----------------------------------------------------------------------------
// Member data lives in data/members.json so 100+ members can be maintained
// without turning this TypeScript file into a huge roster.
// Discord ID is the permanent identity. `name` is display-only/fallback data.
// ============================================================================

import memberData from '@/data/members.json'

export type Role =
  | 'FOUNDER'
  | 'MANAGER'
  | 'CO_MANAGER'
  | 'EXCLUE_GIRLS'
  | 'DIRECTOR'
  | 'MEMBERS'
  | 'SINGLE'
  | 'BATUGAN'


export interface RoleMeta {
  id: Role
  label: string
  blurb: string
}

export function getMemberByProfilePath(profilePath: string): Member | undefined {
  return MEMBERS.find(
    (member) => member.profilePath.toLowerCase() === profilePath.toLowerCase()
  )
}
export const ROLES: RoleMeta[] = [
  { id: 'FOUNDER', label: 'Founder', blurb: 'The one who started it all' },
  { id: 'MANAGER', label: 'Manager', blurb: 'Running the operation' },
  { id: 'CO_MANAGER', label: 'Co-Manager', blurb: 'Second in command' },
  { id: 'EXCLUE_GIRLS', label: 'Xclue Girls', blurb: 'The XCLUE girls' },
  { id: 'DIRECTOR', label: 'Director', blurb: 'Leading the crew' },
  { id: 'MEMBERS', label: 'Members', blurb: 'The core crew' },
  { id: 'SINGLE', label: 'Single', blurb: 'Hinagpis' },
  { id: 'BATUGAN', label: 'Batugan', blurb: 'The core crew' },
]

export interface Social {
  youtube?: string
  tiktok?: string
  spotify?: string
  instagram?: string
  twitter?: string
  kick?: string
  twitch?: string
}

export interface Member {
  /** Display label only. Live Lanyard display name takes precedence. */
  name: string
  /** Fallback Discord handle only. Live Lanyard username takes precedence. */
  username: string
  role: Role
  /** Stable website URL name. Discord ID remains the permanent identity. */
  profilePath: string
  discordId: string
  youtubeUrl: string
  /** Optional local fallback avatar. Live Discord avatar always wins when available. */
  avatar?: string
  gifUrl: string
  background: string
  bio?: string
  banner?: string
  /** Optional per-member gallery images. Supports up to 10 paths/URLs. */
  gallery?: string[]
  socials: Social
  pcSpecs: { cpu?: string; gpu?: string; motherboard?: string; ram?: string }
  peripherals: {
    mouse?: string
    keyboard?: string
    microphone?: string
    headset?: string
  }
}

/**
 * Complete real-member template. This is a template for adding new members;
 * the actual roster is the `members` array in data/members.json.
 */
export const MEMBER_TEMPLATE: Member = memberData.template as Member

/** All real XCLUE members. Add/edit members in data/members.json. */
export const MEMBERS: Member[] = Array.isArray(memberData.members)
  ? (memberData.members as Member[])
  : []

export function getMemberByDiscordId(discordId: string): Member | undefined {
  return MEMBERS.find((member) => member.discordId === discordId)
}

export function getMembersByRole(role: Role): Member[] {
  return MEMBERS.filter((member) => member.role === role)
}

export function getRoleMeta(role: Role): RoleMeta {
  return ROLES.find((roleMeta) => roleMeta.id === role) ?? ROLES[ROLES.length - 1]
}
