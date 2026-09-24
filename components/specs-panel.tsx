import { Cpu, HardDrive, Keyboard, Mic, Monitor, Mouse, Headphones, MemoryStick } from 'lucide-react'
import type { Member } from '@/lib/members'

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value?: string
}) {
  if (!value) return null
  return (
    <div className="xclue-hover-row flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-black/40 text-gold">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function SpecsPanel({ member }: { member: Member }) {
  const { pcSpecs, peripherals } = member
  if (!pcSpecs && !peripherals) return null

  return (
    <div className="flex flex-col gap-6">
      {pcSpecs && (
        <div className="xclue-hover-card rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            PC Specs
          </h2>
          <div className="flex flex-col gap-2">
            <Row icon={Cpu} label="CPU" value={pcSpecs.cpu} />
            <Row icon={Monitor} label="GPU" value={pcSpecs.gpu} />
            <Row icon={HardDrive} label="Motherboard" value={pcSpecs.motherboard} />
            <Row icon={MemoryStick} label="RAM" value={pcSpecs.ram} />
          </div>
        </div>
      )}

      {peripherals && (
        <div className="xclue-hover-card rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Peripherals
          </h2>
          <div className="flex flex-col gap-2">
            <Row icon={Mouse} label="Mouse" value={peripherals.mouse} />
            <Row icon={Keyboard} label="Keyboard" value={peripherals.keyboard} />
            <Row icon={Mic} label="Microphone" value={peripherals.microphone} />
            <Row icon={Headphones} label="Headset / IEM" value={peripherals.headset} />
          </div>
        </div>
      )}
    </div>
  )
}
