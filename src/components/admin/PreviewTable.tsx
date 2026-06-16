import type { ItemImportado } from '../../types'

interface PreviewTableProps {
  items: ItemImportado[]
}

export function PreviewTable({ items }: PreviewTableProps) {
  const tienePeso = items.some(i => i.peso_kg != null && i.peso_kg > 0)

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: `2px solid var(--border)` }}>
            <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>#</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>SKU</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>Descripción</th>
            <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>Cantidad</th>
            {tienePeso && (
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600 }}>Peso (kg)</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: `1px solid var(--border)` }}>
              <td style={{ padding: '8px 12px', color: 'var(--text2)' }}>{i + 1}</td>
              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{item.sku}</td>
              <td style={{ padding: '8px 12px' }}>{item.descripcion}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>{item.cantidad_esperada}</td>
              {tienePeso && (
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.peso_kg}</td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: `2px solid var(--border)`, fontWeight: 700 }}>
            <td style={{ padding: '8px 12px' }}></td>
            <td style={{ padding: '8px 12px' }}>Total</td>
            <td style={{ padding: '8px 12px' }}></td>
            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
              {items.reduce((a, i) => a + i.cantidad_esperada, 0)}
            </td>
            {tienePeso && (
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                {items.reduce((a, i) => a + (i.peso_kg ?? 0), 0)}
              </td>
            )}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
