interface ProgressBarProps {
  valor: number
  max: number
  color?: string
}

export function ProgressBar({ valor, max, color = 'var(--orange)' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((valor / max) * 100, 100) : 0

  return (
    <div
      style={{
        width: '100%',
        height: 8,
        background: 'var(--bg)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: 4,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}
