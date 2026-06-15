import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import type { ResumenPedido } from '../../types'

interface ResumenPedidoProps {
  resumen: ResumenPedido
  onExportar: () => void
  onCerrar: () => void
}

export function ResumenPedido({ resumen, onExportar, onCerrar }: ResumenPedidoProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{resumen.nombre}</h2>
          <p style={{ fontSize: '13px', color: 'var(--text2)' }}>{resumen.crm_ref}</p>
        </div>
        <Badge variant={resumen.estado === 'completado' ? 'green' : 'blue'}>
          {resumen.estado}
        </Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <Card style={{ textAlign: 'center', padding: 12 }}>
          <div style={{ fontSize: '24px', fontWeight: 800 }}>{resumen.total_skus}</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>SKUs</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: 12 }}>
          <div style={{ fontSize: '24px', fontWeight: 800 }}>{resumen.peso_total_kg} kg</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Peso total</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: 12 }}>
          <div style={{ fontSize: '24px', fontWeight: 800 }}>
            {resumen.tiempo_total_seg > 0
              ? `${Math.floor(resumen.tiempo_total_seg / 60)}:${String(resumen.tiempo_total_seg % 60).padStart(2, '0')}`
              : '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Tiempo</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: 12 }}>
          <div style={{
            fontSize: '24px', fontWeight: 800,
            color: resumen.total_diferencia > 0 ? 'var(--red)' : 'var(--green)',
          }}>
            {resumen.total_diferencia}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Diferencia</div>
        </Card>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid var(--border)` }}>
              <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text2)', fontWeight: 600 }}>SKU</th>
              <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text2)', fontWeight: 600 }}>Descripción</th>
              <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text2)', fontWeight: 600 }}>Esperado</th>
              <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text2)', fontWeight: 600 }}>Confirmado</th>
              <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text2)', fontWeight: 600 }}>Diff</th>
              <th style={{ textAlign: 'center', padding: '8px', color: 'var(--text2)', fontWeight: 600 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {resumen.items.map((item) => {
              const diff = (item.cantidad_confirmada ?? 0) - item.cantidad_esperada
              const pct = item.cantidad_esperada > 0 ? Math.abs(diff) / item.cantidad_esperada : 0
              const rowBg = item.estado === 'con_diferencia'
                ? (pct > 0.1 ? 'var(--red-bg)' : 'var(--amber-bg)')
                : item.estado === 'confirmado' ? 'var(--green-bg)' : undefined

              return (
                <tr key={item.id} style={{ borderBottom: `1px solid var(--border)`, background: rowBg }}>
                  <td style={{ padding: '8px', fontWeight: 600 }}>{item.sku}</td>
                  <td style={{ padding: '8px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.descripcion}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{item.cantidad_esperada}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{item.cantidad_confirmada ?? '—'}</td>
                  <td style={{
                    padding: '8px', textAlign: 'right',
                    color: diff === 0 ? 'var(--green)' : diff > 0 ? 'var(--amber)' : 'var(--red)',
                    fontWeight: 700,
                  }}>
                    {diff === 0 ? '0' : `${diff > 0 ? '+' : ''}${diff}`}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <Badge variant={
                      item.estado === 'confirmado' ? 'green' :
                      item.estado === 'con_diferencia' ? 'red' : 'gray'
                    }>
                      {item.estado}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="primary" onClick={onExportar}>
          Exportar Excel
        </Button>
        <Button variant="ghost" onClick={onCerrar}>
          Cerrar
        </Button>
      </div>
    </div>
  )
}
