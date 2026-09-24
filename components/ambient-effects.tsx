'use client'

import { useEffect, useMemo, useState } from 'react'

export function AmbientEffects() {
  const particles = useMemo(
    () => Array.from({ length: 16 }, (_, index) => ({
      id: index,
      left: `${(index * 37 + 9) % 100}%`,
      top: `${(index * 61 + 13) % 100}%`,
      delay: `${(index % 8) * -0.9}s`,
      duration: `${7 + (index % 5)}s`,
      size: `${1 + (index % 3)}px`,
    })),
    [],
  )
  const [pointer, setPointer] = useState({ x: -100, y: -100 })

  useEffect(() => {
    const move = (event: PointerEvent) => setPointer({ x: event.clientX, y: event.clientY })
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden" aria-hidden>
      <div className="xclue-scanline-effect absolute inset-0" />
      <div className="xclue-particle-field absolute inset-0">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="xclue-particle"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>
      <div
        className="xclue-cursor-glow absolute"
        style={{ transform: `translate3d(${pointer.x - 80}px, ${pointer.y - 80}px, 0)` }}
      />
    </div>
  )
}
