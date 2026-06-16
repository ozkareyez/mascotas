import { useEffect, useState, useCallback, useMemo } from 'react'
import { usePedidosStore } from '../store/pedidosStore'
import { Navbar } from '../components/shared/Navbar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { UploadZone } from '../components/admin/UploadZone'
import { PreviewTable } from '../components/admin/PreviewTable'
import { PedidoCard } from '../components/admin/PedidoCard'
import { ResumenPedido as ResumenPedidoComponent } from '../components/admin/ResumenPedido'
import { ProgressBar } from '../components/ui/ProgressBar'
import { MetricasGrid } from '../components/admin/MetricasGrid'
import { LoadingScreen } from '../components/shared/LoadingScreen'
import { parsearExcelPedido, exportarReporteExcel, exportarReporteGlobal } from '../utils/excel'
import { extraerFechaLocal } from '../utils/dateUtils'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import type { ResumenPedido, GrupoPedidoImportado, Usuario } from '../types'

export function AdminPage() {
  const { pedidos, cargando, cargarPedidos, crearPedido, obtenerResumen, asignarOperario, suscribirRealtime } = usePedidosStore()

  const [vista, setVista] = useState<'dashboard' | 'cargar'>('dashboard')
  const [gruposImportados, setGruposImportados] = useState<GrupoPedidoImportado[]>([])
  const [creando, setCreando] = useState(false)
  const [progresoCreacion, setProgresoCreacion] = useState(0)
  const [progresoTotal, setProgresoTotal] = useState(0)
  const [pedidoResumen, setPedidoResumen] = useState<ResumenPedido | null>(null)
  const [operarios, setOperarios] = useState<Usuario[]>([])
  const [fechaFiltro, setFechaFiltro] = useState('')

  const recargar = useCallback(() => {
    cargarPedidos()
  }, [cargarPedidos])

  useEffect(() => {
    cargarPedidos()
  }, [cargarPedidos])

  useEffect(() => {
    const cleanup = suscribirRealtime(recargar)
    return cleanup
  }, [recargar, suscribirRealtime])

  useEffect(() => {
    supabase.from('usuarios').select('*').eq('rol', 'operario').eq('activo', true).then(({ data }) => {
      if (data) setOperarios(data as Usuario[])
    })
  }, [])

  // Filtrar pedidos por fecha (client-side, local timezone)
  const pedidosFiltrados = useMemo(() => {
    if (!fechaFiltro) return pedidos
    return pedidos.filter(p => {
      if (!p.creado_en) return false
      return extraerFechaLocal(p.creado_en) === fechaFiltro
    })
  }, [pedidos, fechaFiltro])

  const handleArchivo = async (archivo: File) => {
    try {
      const resultado = await parsearExcelPedido(archivo)
      setGruposImportados(resultado.grupos)
      setVista('cargar')
      const cols = resultado.columnasDetectadas
      const totalItems = resultado.items.length
      const totalGrupos = resultado.grupos.length
      const msg = `${totalItems} ítems en ${totalGrupos} pedido${totalGrupos > 1 ? 's' : ''}`
      const colsMsg = [`SKU: ${cols.sku}`, `Cant: ${cols.cantidad}`]
      if (cols.documento !== '—') colsMsg.push(`Doc: ${cols.documento}`)
      if (cols.peso !== '—') colsMsg.push(`Peso: ${cols.peso}`)
      toast.success(`${msg} (${colsMsg.join(' | ')})`, { duration: 6000 })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al leer archivo')
    }
  }

  const handleCrearPedidos = async () => {
    if (gruposImportados.length === 0) {
      toast.error('No hay pedidos para crear')
      return
    }

    let creados = 0
    setCreando(true)
    setProgresoCreacion(0)
    setProgresoTotal(gruposImportados.length)
    try {
      for (const grupo of gruposImportados) {
        try {
          const nombre = grupo.documentoRef || grupo.nombre
          await crearPedido(nombre, grupo.documentoRef, null, grupo.items)
          creados++
        } catch {
          toast.error(`Error al crear pedido ${grupo.nombre}`)
        }
        setProgresoCreacion(creados)
      }
    } finally {
      setCreando(false)
    }

    if (creados > 0) {
      toast.success(`${creados} pedido${creados > 1 ? 's' : ''} creado${creados > 1 ? 's' : ''} exitosamente`)
      setGruposImportados([])
      setVista('dashboard')
      recargar()
    }
  }

  const handleVerDetalle = async (pedidoId: string) => {
    try {
      const resumen = await obtenerResumen(pedidoId)
      setPedidoResumen(resumen)
    } catch {
      toast.error('Error al cargar detalle')
    }
  }

  const handleExportar = async () => {
    if (!pedidoResumen) return
    try {
      await exportarReporteExcel(pedidoResumen)
      toast.success('Reporte descargado')
    } catch {
      toast.error('Error al exportar')
    }
  }

  const handleExportarTodo = async () => {
    if (pedidosFiltrados.length === 0) {
      toast.error('No hay pedidos para exportar')
      return
    }
    try {
      await exportarReporteGlobal(pedidosFiltrados, operarios)
      toast.success('Reporte descargado')
    } catch {
      toast.error('Error al exportar')
    }
  }

  const handleAsignarOperario = async (pedidoId: string, operarioId: string) => {
    try {
      await asignarOperario(pedidoId, operarioId)
      toast.success('Operario asignado')
      recargar()
    } catch {
      toast.error('Error al asignar operario')
    }
  }

  const totalItemsImportados = gruposImportados.reduce((a, g) => a + g.items.length, 0)

  // Métricas del dashboard (usando pedidosFiltrados)
  const totalPendientes = pedidosFiltrados.filter(p => p.estado === 'pendiente').length
  const totalEnProgreso = pedidosFiltrados.filter(p => p.estado === 'en_progreso').length
  const totalCompletados = pedidosFiltrados.filter(p => p.estado === 'completado').length
  const totalSkus = pedidosFiltrados.reduce((a, p) => a + p.total_skus, 0)

  const pedidosPendientesOActivos = pedidosFiltrados.filter(p => p.estado !== 'completado')
  const pedidosFinalizados = pedidosFiltrados.filter(p => p.estado === 'completado')

  return (
    <>
      <Navbar />

      {/* Modal: paso 1 — subir Excel, paso 2 — confirmar pedidos */}
      <Modal abierto={vista === 'cargar'} onCerrar={() => { setVista('dashboard'); setGruposImportados([]) }}>
        {gruposImportados.length === 0 ? (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: 16 }}>Subir pedido</h2>
            <UploadZone onArchivo={handleArchivo} />
            <Button variant="ghost" onClick={() => setVista('dashboard')} style={{ marginTop: 12, width: '100%' }}>
              Cancelar
            </Button>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: 4 }}>
              Confirmar pedidos
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: 16 }}>
              {gruposImportados.length} pedido{gruposImportados.length > 1 ? 's' : ''} detectado{gruposImportados.length > 1 ? 's' : ''} — {totalItemsImportados} ítems en total
            </p>

            {gruposImportados.map((grupo, gi) => (
              <div key={gi} style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: 'var(--orange-bg)', borderRadius: 'var(--radius)',
                  marginBottom: 8,
                }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{grupo.nombre}</span>
                    <span style={{ marginLeft: 8, fontSize: '13px', color: 'var(--text2)' }}>
                      {grupo.totalSkus} SKU{grupo.totalSkus > 1 ? 's' : ''}
                    </span>
                  </div>
                  <Badge variant="orange">Doc: {grupo.documentoRef || '—'}</Badge>
                </div>
                <PreviewTable items={grupo.items} />
              </div>
            ))}

            {creando && (
              <div style={{ marginBottom: 16 }}>
                <ProgressBar valor={progresoCreacion} max={progresoTotal} />
                <div style={{ fontSize: '13px', color: 'var(--text2)', textAlign: 'center', marginTop: 6 }}>
                  {progresoCreacion} de {progresoTotal} pedidos
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <Button variant="primary" onClick={handleCrearPedidos} disabled={creando} style={{ flex: 1 }}>
                {creando ? 'Creando...' : `Crear ${gruposImportados.length} pedido${gruposImportados.length > 1 ? 's' : ''}`}
              </Button>
              <Button variant="ghost" onClick={() => { setVista('dashboard'); setGruposImportados([]) }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de detalle de pedido */}
      <Modal abierto={!!pedidoResumen} onCerrar={() => setPedidoResumen(null)}>
        {pedidoResumen && (
          <ResumenPedidoComponent
            resumen={pedidoResumen}
            onExportar={handleExportar}
            onCerrar={() => setPedidoResumen(null)}
          />
        )}
      </Modal>

        {/* Dashboard */}
      <div className="page page-wide">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Dashboard</h1>
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              style={{
                padding: '6px 10px',
                border: `1px solid var(--border)`,
                borderRadius: 'var(--radius)',
                fontSize: '14px',
                color: 'var(--text)',
                background: 'var(--white)',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {pedidosFiltrados.length > 0 && (
              <Button variant="ghost" onClick={handleExportarTodo}>
                Exportar todo
              </Button>
            )}
            <Button onClick={() => { setGruposImportados([]); setVista('cargar') }}>
              + Nuevo pedido
            </Button>
          </div>
        </div>

        {/* Métricas */}
        <div style={{ marginBottom: 20 }}>
          <MetricasGrid metricas={[
            { label: 'Pendientes', valor: totalPendientes, color: 'var(--text2)' },
            { label: 'En progreso', valor: totalEnProgreso, color: 'var(--orange)' },
            { label: 'Completados', valor: totalCompletados, color: 'var(--green)' },
            { label: 'Total SKUs', valor: totalSkus, color: 'var(--orange)' },
          ]} />
        </div>

        {/* Pedidos activos */}
        {pedidosPendientesOActivos.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 12 }}>Pedidos activos</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pedidosPendientesOActivos.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  operarios={operarios}
                  onAsignarOperario={handleAsignarOperario}
                  onClick={() => handleVerDetalle(pedido.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pedidos finalizados */}
        {pedidosFinalizados.length > 0 && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 12 }}>Finalizados</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pedidosFinalizados.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  operarios={operarios}
                  onAsignarOperario={handleAsignarOperario}
                  onClick={() => handleVerDetalle(pedido.id)}
                />
              ))}
            </div>
          </div>
        )}

        {!cargando && pedidosFiltrados.length === 0 && (
          <Card style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
            <div style={{ fontSize: '36px', marginBottom: 12 }}>📦</div>
            <p>{fechaFiltro ? 'No hay pedidos para esta fecha.' : 'No hay pedidos aún. Sube un Excel para comenzar.'}</p>
            <Button
              variant="primary"
              onClick={() => { setGruposImportados([]); setVista('cargar') }}
              style={{ marginTop: 12 }}
            >
              Subir primer pedido
            </Button>
          </Card>
        )}

        {cargando && <LoadingScreen />}
      </div>
    </>
  )
}
