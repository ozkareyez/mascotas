import type { ItemPedido } from '../../types'

interface SkuNavProps {
  items: ItemPedido[]
  activoIdx: number
  onSeleccionar: (idx: number) => void
}

export function SkuNav({ items, activoIdx, onSeleccionar }: SkuNavProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        padding: '12px 0',
      }}
    >
      {items.map((item, idx) => {
        let bg = 'var(--bg)'
        let color = 'var(--text2)'
        let border = 'var(--border)'

        if (idx === activoIdx) {
          bg = 'var(--orange)'
          color = '#fff'
          border = 'var(--orange)'
        } else if (item.estado === 'confirmado') {
          bg = 'var(--green-bg)'
          color = 'var(--green)'
          border = 'var(--green)'
        } else if (item.estado === 'con_diferencia') {
          bg = 'var(--red-bg)'
          color = 'var(--red)'
          border = 'var(--red)'
        }

        return (
          <button
            key={item.id}
            onClick={() => onSeleccionar(idx)}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: '13px',
              fontWeight: 600,
              background: bg,
              color,
              border: `1px solid ${border}`,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {item.sku}
          </button>
        )
      })}
    </div>
  )
}
