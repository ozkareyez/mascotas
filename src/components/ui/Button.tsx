import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'success' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--orange)', color: '#fff' },
  success: { background: 'var(--green)', color: '#fff' },
  danger: { background: 'var(--red)', color: '#fff' },
  ghost: { background: 'transparent', color: 'var(--orange)', border: '1px solid var(--border)' },
}

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '14px' },
  md: { padding: '10px 20px', fontSize: '16px' },
  lg: { padding: '14px 28px', fontSize: '18px' },
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 'var(--radius)',
        fontWeight: 600,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.15s',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}
