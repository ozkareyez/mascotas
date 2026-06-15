import { Button } from '../ui/Button'

interface DoneScreenProps {
  nombrePedido: string
  totalItems: number
  itemsConDiferencia: number
  tiempoFormateado: string
  onFinalizar: () => void
}

export function DoneScreen({
  nombrePedido,
  totalItems,
  itemsConDiferencia,
  tiempoFormateado,
  onFinalizar,
}: DoneScreenProps) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'var(--green-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
        }}
      >
        ✓
      </div>

      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: 8 }}>
          ¡Pedido completado!
        </h1>
        <p style={{ color: 'var(--text2)' }}>{nombrePedido}</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 16,
          width: '100%',
          maxWidth: 360,
        }}
      >
        <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--orange)' }}>{totalItems}</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>SKUs</div>
        </div>
        <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: itemsConDiferencia > 0 ? 'var(--red)' : 'var(--green)' }}>
            {itemsConDiferencia}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Diferencias</div>
        </div>
        <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--orange)' }}>{tiempoFormateado}</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Tiempo</div>
        </div>
      </div>

      <Button variant="success" size="lg" onClick={onFinalizar} style={{ width: '100%', maxWidth: 360 }}>
        Finalizar y enviar al administrador
      </Button>
    </div>
  )
}
