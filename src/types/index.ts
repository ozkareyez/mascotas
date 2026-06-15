export type Rol = 'operario' | 'admin'

export interface Usuario {
  id: string
  email: string
  nombre: string
  rol: Rol
}

export type EstadoPedido = 'pendiente' | 'en_progreso' | 'completado'
export type EstadoItem = 'pendiente' | 'confirmado' | 'con_diferencia'

export interface Pedido {
  id: string
  nombre: string
  crm_ref: string
  estado: EstadoPedido
  operario_id: string | null
  operario?: Usuario | null
  creado_por: string | null
  creado_en: string
  iniciado_en: string | null
  finalizado_en: string | null
  tiempo_total_seg: number
  total_skus: number
  peso_total_kg: number
}

export interface ItemPedido {
  id: string
  pedido_id: string
  sku: string
  descripcion: string
  cantidad_esperada: number
  cantidad_confirmada: number | null
  peso_kg: number
  estado: EstadoItem
  observaciones: string
  confirmado_en: string | null
  orden: number
}

export interface ResumenPedido extends Pedido {
  items: ItemPedido[]
  total_diferencia: number
  items_con_diferencia: number
}

export interface ItemImportado {
  sku: string
  descripcion: string
  cantidad_esperada: number
  peso_kg?: number
  documentoRef?: string
}

export interface GrupoPedidoImportado {
  documentoRef: string
  nombre: string
  items: ItemImportado[]
  totalSkus: number
}
