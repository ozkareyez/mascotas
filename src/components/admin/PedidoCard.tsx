import { ProgressBar } from '../ui/ProgressBar'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import type { Pedido, ItemPedido, Usuario } from '../../types'

interface PedidoCardProps {
  pedido: Pedido
  items?: ItemPedido[]
  operarios?: Usuario[]
  onAsignarOperario?: (pedidoId: string, operarioId: string) => void
  onClick: () => void
}

const estadoBadge: Record<string, { variant: 'orange' | 'green' | 'gray'; label: string }> = {
  pendiente: { variant: 'gray', label: 'Pendiente' },
  en_progreso: { variant: 'orange', label: 'En progreso' },
  completado: { variant: 'green', label: 'Completado' },
}

export function PedidoCard({ pedido, items, operarios, onAsignarOperario, onClick }: PedidoCardProps) {
  const confirmados = items?.filter(i => i.estado !== 'pendiente').length ?? 0
  const total = items?.length ?? pedido.total_skus
  const badge = estadoBadge[pedido.estado] ?? estadoBadge.pendiente!
  const badgeVariant = badge.variant
  const badgeLabel = badge.label

  return (
    <Card onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{pedido.nombre}</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{pedido.crm_ref}</div>
        </div>
        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
      </div>

      <div style={{ marginBottom: 8 }}>
        {!pedido.operario_id && onAsignarOperario && operarios ? (
          <select
            value=""
            onChange={(e) => {
              e.stopPropagation()
              onAsignarOperario(pedido.id, e.target.value)
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '6px 8px',
              border: `1px solid var(--border)`,
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              background: 'var(--white)',
              color: 'var(--text2)',
              cursor: 'pointer',
            }}
          >
            <option value="">Asignar operario...</option>
            {operarios.map((op) => (
              <option key={op.id} value={op.id}>{op.nombre}</option>
            ))}
          </select>
        ) : (
          pedido.operario_id && (
            <span style={{ fontSize: '13px', color: 'var(--text2)' }}>
              Operario: {pedido.operario?.nombre ?? operarios?.find(o => o.id === pedido.operario_id)?.nombre ?? pedido.operario_id}
            </span>
          )
        )}
      </div>

      <div style={{ marginBottom: 4 }}>
        <ProgressBar valor={confirmados} max={total} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text2)' }}>
        <span>{confirmados} de {total} SKUs</span>
        {pedido.tiempo_total_seg > 0 && (
          <span>{Math.floor(pedido.tiempo_total_seg / 60)} min</span>
        )}
      </div>
    </Card>
  )
}
