import type { ReactNode } from 'react'

type Variant = 'orange' | 'blue' | 'green' | 'amber' | 'red' | 'gray'

interface BadgeProps {
  variant?: Variant
  children: ReactNode
}

const bgMap: Record<Variant, string> = {
  orange: 'var(--orange-bg)',
  blue: 'var(--orange-bg)',
  green: 'var(--green-bg)',
  amber: 'var(--amber-bg)',
  red: 'var(--red-bg)',
  gray: 'var(--bg)',
}

const colorMap: Record<Variant, string> = {
  orange: 'var(--orange)',
  blue: 'var(--orange)',
  green: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  gray: 'var(--text2)',
}

const borderMap: Record<Variant, string> = {
  orange: 'var(--orange)',
  blue: 'var(--orange)',
  green: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  gray: 'var(--border)',
}

export function Badge({ variant = 'gray', children }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: '13px',
        fontWeight: 600,
        background: bgMap[variant],
        color: colorMap[variant],
        border: `1px solid ${borderMap[variant]}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}
