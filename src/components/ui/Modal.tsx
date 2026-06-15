import type { ReactNode } from 'react'

interface ModalProps {
  abierto: boolean
  onCerrar: () => void
  children: ReactNode
}

export function Modal({ abierto, onCerrar, children }: ModalProps) {
  if (!abierto) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius)',
          padding: 24,
          maxWidth: 480,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
