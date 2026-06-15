import { useState } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import type { ItemPedido } from '../../types'

interface ItemCardProps {
  item: ItemPedido
  onConfirmar: (cantidad: number, observaciones: string) => void
  onAnterior: () => void
  onSiguiente: () => void
  hayAnterior: boolean
  haySiguiente: boolean
  totalItems: number
  currentIdx: number
}

export function ItemCard({
  item,
  onConfirmar,
  onAnterior,
  onSiguiente,
  hayAnterior,
  haySiguiente,
  totalItems,
  currentIdx,
}: ItemCardProps) {
  const [cantidad, setCantidad] = useState(item.cantidad_confirmada ?? 0)
  const [observaciones, setObservaciones] = useState(item.observaciones ?? '')
  const yaConfirmado = item.estado !== 'pendiente'

  const diferencia = cantidad - item.cantidad_esperada
  const pctDiferencia = item.cantidad_esperada > 0 ? Math.abs(diferencia) / item.cantidad_esperada : 0

  let badgeVariant: 'green' | 'amber' | 'red' | 'gray' = 'gray'
  let badgeLabel = '— Pendiente'
  if (yaConfirmado && diferencia === 0) {
    badgeVariant = 'green'
    badgeLabel = '✓ Exacto'
  } else if (yaConfirmado && pctDiferencia <= 0.1) {
    badgeVariant = 'amber'
    badgeLabel = `⚠ ${diferencia > 0 ? '+' : ''}${diferencia}`
  } else if (yaConfirmado && pctDiferencia > 0.1) {
    badgeVariant = 'red'
    badgeLabel = `✗ ${diferencia > 0 ? '+' : ''}${diferencia}`
  }

  const confirmar = () => {
    onConfirmar(cantidad, observaciones)
  }

  return (
    <Card style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Badge variant="orange">Item {currentIdx + 1} de {totalItems}</Badge>
        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: 2 }}>SKU</div>
        <div style={{ fontSize: '20px', fontWeight: 700 }}>{item.sku}</div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: 2 }}>Descripción</div>
        <div style={{ fontSize: '18px' }}>{item.descripcion}</div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: 4 }}>Cantidad esperada</div>
        <div style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1.1, color: 'var(--orange)' }}>
          {item.cantidad_esperada}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>
          Cantidad separada
        </label>
        <input
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '32px',
            fontWeight: 700,
            border: `2px solid var(--border)`,
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            outline: 'none',
            background: yaConfirmado ? 'var(--bg)' : 'var(--white)',
            color: 'var(--text)',
            transition: 'border-color 0.15s',
          }}
          disabled={yaConfirmado}
          min={0}
          step="any"
          inputMode="decimal"
          onFocus={(e) => { if (!yaConfirmado) e.target.style.borderColor = 'var(--orange)' }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>

      {diferencia !== 0 && !yaConfirmado && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius)',
            marginBottom: 16,
            fontSize: '14px',
            fontWeight: 600,
            background: pctDiferencia > 0.1 ? 'var(--red-bg)' : 'var(--amber-bg)',
            color: pctDiferencia > 0.1 ? 'var(--red)' : 'var(--amber)',
          }}
        >
          {diferencia > 0 ? '+' : ''}{diferencia} de diferencia ({Math.round(pctDiferencia * 100)}%)
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>
          Observaciones
        </label>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={2}
          disabled={yaConfirmado}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1px solid var(--border)`,
            borderRadius: 'var(--radius)',
            fontSize: '16px',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {!yaConfirmado && (
        <Button variant="primary" size="lg" onClick={confirmar} style={{ width: '100%' }}>
          Confirmar ítem
        </Button>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button variant="ghost" size="sm" disabled={!hayAnterior} onClick={onAnterior} style={{ flex: 1 }}>
          ← Anterior
        </Button>
        <Button variant="ghost" size="sm" disabled={!haySiguiente} onClick={onSiguiente} style={{ flex: 1 }}>
          Siguiente →
        </Button>
      </div>
    </Card>
  )
}
