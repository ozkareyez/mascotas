import { Card } from '../ui/Card'

interface Metrica {
  label: string
  valor: string | number
  color?: string
}

interface MetricasGridProps {
  metricas: Metrica[]
}

export function MetricasGrid({ metricas }: MetricasGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {metricas.map((m, i) => (
        <Card key={i} style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: m.color ?? 'var(--orange)' }}>
            {m.valor}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: 2 }}>{m.label}</div>
        </Card>
      ))}
    </div>
  )
}
