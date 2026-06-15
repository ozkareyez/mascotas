import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, id, style, ...rest }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text2)' }}>
          {label}
        </label>
      )}
      <input
        id={id}
        style={{
          padding: '10px 12px',
          border: `1px solid var(--border)`,
          borderRadius: 'var(--radius)',
          fontSize: '16px',
          color: 'var(--text)',
          background: 'var(--white)',
          outline: 'none',
          transition: 'border-color 0.15s',
          ...style,
        }}
        {...rest}
      />
    </div>
  )
}
