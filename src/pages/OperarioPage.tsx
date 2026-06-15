import { useEffect, useState, useCallback } from 'react'
import { usePedidosStore } from '../store/pedidosStore'
import { useTimer } from '../hooks/useTimer'
import { Navbar } from '../components/shared/Navbar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ItemCard } from '../components/operario/ItemCard'
import { SkuNav } from '../components/operario/SkuNav'
import { DoneScreen } from '../components/operario/DoneScreen'
import { LoadingScreen } from '../components/shared/LoadingScreen'
import { toast } from 'sonner'
import type { Pedido } from '../types'

export function OperarioPage() {
  const {
    pedidos, pedidoActivo, items, itemActualIdx, cargando,
    cargarPedidos, activarPedido, confirmarItem, finalizarPedido, navegarItem,
  } = usePedidosStore()

  const { tiempoFormateado, segundos } = useTimer(pedidoActivo?.estado === 'en_progreso', pedidoActivo?.tiempo_total_seg ?? 0)
  const [vistaResumen, setVistaResumen] = useState(true)

  const recargar = useCallback(() => {
    cargarPedidos()
  }, [cargarPedidos])

  useEffect(() => {
    cargarPedidos()
  }, [cargarPedidos])

  // Realtime: recargar cuando lleguen cambios
  useEffect(() => {
    const cleanup = usePedidosStore.getState().suscribirRealtime(recargar)
    return cleanup
  }, [recargar])

  const handleActivar = async (pedido: Pedido) => {
    await activarPedido(pedido)
    setVistaResumen(false)
    toast.success('Pedido activado')
  }

  const handleConfirmar = async (cantidad: number, observaciones: string) => {
    const item = items[itemActualIdx]
    if (!item) return
    try {
      await confirmarItem(item.id, cantidad, observaciones)
      toast.success('Ítem confirmado')
    } catch {
      toast.error('Error al confirmar ítem')
    }
  }

  const handleFinalizar = async () => {
    if (!pedidoActivo) return
    try {
      await finalizarPedido(pedidoActivo.id, segundos)
      setVistaResumen(true)
      toast.success('Pedido finalizado')
    } catch {
      toast.error('Error al finalizar pedido')
    }
  }

  const todosConfirmados = items.length > 0 && items.every(i => i.estado !== 'pendiente')

  // Vista de resumen: lista de pedidos asignados
  if (vistaResumen || !pedidoActivo) {
    return (
      <>
        <Navbar />
        <div className="page">
          <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: 16 }}>
            Mis pedidos
          </h1>

          {cargando && <LoadingScreen />}

          {!cargando && pedidos.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text2)' }}>
              No tienes pedidos asignados
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pedidos.map((pedido) => {
              return (
                <Card
                  key={pedido.id}
                  onClick={pedido.estado === 'completado' ? undefined : () => handleActivar(pedido)}
                  style={{
                    opacity: pedido.estado === 'completado' ? 0.6 : 1,
                    borderLeft: pedido.estado === 'completado'
                      ? `4px solid var(--green)`
                      : pedido.estado === 'en_progreso'
                      ? `4px solid var(--orange)`
                      : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{pedido.nombre}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{pedido.crm_ref}</div>
                    </div>
                    <Badge variant={
                      pedido.estado === 'completado' ? 'green' :
                      pedido.estado === 'en_progreso' ? 'blue' : 'gray'
                    }>
                      {pedido.estado === 'pendiente' ? 'Pendiente' :
                       pedido.estado === 'en_progreso' ? 'En progreso' : 'Completado'}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
                    {pedido.total_skus} SKUs
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </>
    )
  }

  // Vista de pedido activo — DoneScreen si todos confirmados
  if (todosConfirmados) {
    return (
      <>
        <Navbar />
        <DoneScreen
          nombrePedido={pedidoActivo.nombre}
          totalItems={pedidoActivo.total_skus}
          itemsConDiferencia={items.filter(i => i.estado === 'con_diferencia').length}
          tiempoFormateado={tiempoFormateado}
          onFinalizar={handleFinalizar}
        />
      </>
    )
  }

  // Vista de picking activo
  const itemActual = items[itemActualIdx]

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{pedidoActivo.nombre}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{pedidoActivo.crm_ref}</div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--orange)' }}>
            {tiempoFormateado}
          </div>
        </div>

        <ProgressBar
          valor={items.filter(i => i.estado !== 'pendiente').length}
          max={items.length}
        />

        <SkuNav
          items={items}
          activoIdx={itemActualIdx}
          onSeleccionar={navegarItem}
        />

        {itemActual && (
          <ItemCard
            key={itemActual.id}
            item={itemActual}
            onConfirmar={handleConfirmar}
            onAnterior={() => navegarItem(itemActualIdx - 1)}
            onSiguiente={() => navegarItem(itemActualIdx + 1)}
            hayAnterior={itemActualIdx > 0}
            haySiguiente={itemActualIdx < items.length - 1}
            totalItems={items.length}
            currentIdx={itemActualIdx}
          />
        )}
      </div>
    </>
  )
}
