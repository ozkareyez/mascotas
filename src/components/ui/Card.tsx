import type { ReactNode, CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  style?: CSSProperties
  onClick?: () => void
}

export function Card({ children, style, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--white)',
        border: `1px solid var(--border)`,
        borderRadius: 'var(--radius)',
        padding: 16,
        boxShadow: 'var(--shadow)',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'box-shadow 0.15s, transform 0.15s',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = 'var(--shadow-hover)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = 'var(--shadow)'
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }}
    >
      {children}
    </div>
  )
}
