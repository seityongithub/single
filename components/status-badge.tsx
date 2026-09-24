import type { DiscordStatus } from '@/lib/lanyard'
import { statusLabel } from '@/lib/lanyard'
import { cn } from '@/lib/utils'

const DOT: Record<DiscordStatus, string> = {
  online: 'bg-[#23a55a]',
  idle: 'bg-[#f0b232]',
  dnd: 'bg-[#f23f42]',
  offline: 'bg-[#80848e]',
}

export function StatusDot({
  status,
  className,
}: {
  status: DiscordStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-block rounded-full ring-2 ring-background',
        DOT[status],
        status !== 'offline' && 'animate-pulse-slow',
        className,
      )}
    />
  )
}

export function StatusBadge({ status }: { status: DiscordStatus }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium">
      <StatusDot status={status} className="h-2 w-2" />
      {statusLabel(status)}
    </span>
  )
}
