import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './authStore'
import type { Pedido, ItemPedido, ResumenPedido, ItemImportado, EstadoItem } from '../types'

interface PedidosState {
  pedidos: Pedido[]
  pedidoActivo: Pedido | null
  items: ItemPedido[]
  itemActualIdx: number
  cargando: boolean

  cargarPedidos: () => Promise<void>
  activarPedido: (pedido: Pedido) => Promise<void>
  confirmarItem: (itemId: string, cantidad: number, observaciones: string) => Promise<void>
  finalizarPedido: (pedidoId: string, tiempoSeg: number) => Promise<void>
  crearPedido: (nombre: string, crmRef: string, operarioId: string | null, items: ItemImportado[]) => Promise<void>
  obtenerResumen: (pedidoId: string) => Promise<ResumenPedido>
  navegarItem: (idx: number) => void
  asignarOperario: (pedidoId: string, operarioId: string) => Promise<void>
  suscribirRealtime: (onCambio: () => void) => () => void
}

export const usePedidosStore = create<PedidosState>((set, get) => ({
  pedidos: [],
  pedidoActivo: null,
  items: [],
  itemActualIdx: 0,
  cargando: false,

  cargarPedidos: async () => {
    set({ cargando: true })
    const usuario = useAuthStore.getState().usuario
    if (!usuario) {
      set({ pedidos: [], cargando: false })
      return
    }

    let query = supabase
      .from('pedidos')
      .select('*')
      .order('creado_en', { ascending: false })

    if (usuario.rol === 'operario') {
      query = query.eq('operario_id', usuario.id)
    }

    const { data, error } = await query
    if (error) throw error
    set({ pedidos: ((data as Pedido[]) ?? []).map(p => ({ ...p, operario: undefined })), cargando: false })
  },

  activarPedido: async (pedido: Pedido) => {
    const now = new Date().toISOString()
    await supabase
      .from('pedidos')
      .update({ estado: 'en_progreso', iniciado_en: now })
      .eq('id', pedido.id)

    const { data: items } = await supabase
      .from('items_pedido')
      .select('*')
      .eq('pedido_id', pedido.id)
      .order('orden')

    const pedidoActualizado = { ...pedido, estado: 'en_progreso' as const, iniciado_en: now }
    set({
      pedidoActivo: pedidoActualizado,
      items: (items as ItemPedido[]) ?? [],
      itemActualIdx: 0,
    })
  },

  confirmarItem: async (itemId: string, cantidad: number, observaciones: string) => {
    const { items, pedidoActivo } = get()
    const item = items.find(i => i.id === itemId)
    if (!item || !pedidoActivo) return

    const estado = cantidad === item.cantidad_esperada ? 'confirmado' : 'con_diferencia'

    await supabase
      .from('items_pedido')
      .update({
        cantidad_confirmada: cantidad,
        observaciones,
        estado,
        confirmado_en: new Date().toISOString(),
      })
      .eq('id', itemId)

    const itemsActualizados = items.map(i =>
      i.id === itemId ? { ...i, cantidad_confirmada: cantidad, observaciones, estado: estado as EstadoItem, confirmado_en: new Date().toISOString() } : i
    )
    const siguienteIdx = get().itemActualIdx + 1
    set({ items: itemsActualizados, itemActualIdx: siguienteIdx >= items.length ? items.length - 1 : siguienteIdx })
  },

  finalizarPedido: async (pedidoId: string, tiempoSeg: number) => {
    const now = new Date().toISOString()
    await supabase
      .from('pedidos')
      .update({ estado: 'completado', finalizado_en: now, tiempo_total_seg: tiempoSeg })
      .eq('id', pedidoId)

    set({ pedidoActivo: null, items: [], itemActualIdx: 0 })
  },

  crearPedido: async (nombre: string, crmRef: string, operarioId: string | null, itemsImport: ItemImportado[]) => {
    const usuario = useAuthStore.getState().usuario
    if (!usuario) return

    // Verificar si ya existe un pedido con ese crm_ref
    const { data: existente } = await supabase
      .from('pedidos')
      .select('id')
      .eq('crm_ref', crmRef)
      .maybeSingle()
    if (existente) throw new Error(`El pedido ${crmRef} ya existe`)

    const totalSku = itemsImport.length
    const pesoTotal = itemsImport.reduce((acc, item) => acc + (item.peso_kg ?? 0), 0)

    const { data: pedido, error: errPedido } = await supabase
      .from('pedidos')
      .insert({
        nombre,
        crm_ref: crmRef,
        operario_id: operarioId,
        total_skus: totalSku,
        peso_total_kg: pesoTotal,
        creado_por: usuario.id,
      })
      .select()
      .single()

    if (errPedido) throw errPedido
    if (!pedido) throw new Error('No se pudo crear el pedido')

    const itemsInsert = itemsImport.map((item, i) => ({
      pedido_id: pedido.id,
      sku: item.sku,
      descripcion: item.descripcion,
      cantidad_esperada: item.cantidad_esperada,
      peso_kg: item.peso_kg ?? 0,
      orden: i,
    }))

    const { error: errItems } = await supabase.from('items_pedido').insert(itemsInsert)
    if (errItems) throw errItems
  },

  obtenerResumen: async (pedidoId: string): Promise<ResumenPedido> => {
    const { data: pedido, error: errP } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single()
    if (errP || !pedido) throw errP ?? new Error('Pedido no encontrado')

    const { data: items } = await supabase
      .from('items_pedido')
      .select('*')
      .eq('pedido_id', pedidoId)
      .order('orden')

    const itemsData = (items as ItemPedido[]) ?? []
    const totalDiferencia = itemsData.reduce((acc, i) => {
      if (i.cantidad_confirmada != null) return acc + Math.abs(i.cantidad_esperada - i.cantidad_confirmada)
      return acc
    }, 0)
    const itemsConDiferencia = itemsData.filter(i => i.estado === 'con_diferencia').length

    return {
      ...(pedido as Pedido),
      items: itemsData,
      total_diferencia: totalDiferencia,
      items_con_diferencia: itemsConDiferencia,
    }
  },

  asignarOperario: async (pedidoId: string, operarioId: string) => {
    await supabase.from('pedidos').update({ operario_id: operarioId }).eq('id', pedidoId)
  },

  navegarItem: (idx: number) => {
    const { items } = get()
    if (idx >= 0 && idx < items.length) {
      set({ itemActualIdx: idx })
    }
  },

  suscribirRealtime: (onCambio: () => void) => {
    const canal = supabase
      .channel('pedidos-live')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => { onCambio() }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'items_pedido' },
        () => { onCambio() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  },
}))
