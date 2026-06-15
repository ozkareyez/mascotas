import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import type { ItemImportado, ResumenPedido, ItemPedido, GrupoPedidoImportado } from '../types'

export interface ResultadoParseo {
  items: ItemImportado[]
  grupos: GrupoPedidoImportado[]
  columnasDetectadas: Record<string, string>
}

export function parsearExcelPedido(archivo: File): Promise<ResultadoParseo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error('No se pudo leer el archivo'))
          return
        }
        const workbook = XLSX.read(data, { type: 'array' })
        const hoja = workbook.Sheets[workbook.SheetNames[0] as string]
        if (!hoja) {
          reject(new Error('El archivo no contiene hojas'))
          return
        }

        // Leer filas como arrays (raw) para detectar encabezado en cualquier fila
        const filasRaw = XLSX.utils.sheet_to_json<(string | undefined)[]>(hoja, { header: 1 })
        if (filasRaw.length === 0) {
          reject(new Error('El archivo está vacío'))
          return
        }

        const aTexto = (v: unknown): string => {
          if (v == null) return ''
          return String(v).trim()
        }

        const normalizar = (s: string) =>
          s.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '')

        const esTextoValido = (v: unknown): v is string => {
          const t = aTexto(v)
          return t !== '' && !/^[\d.,%]+$/.test(t)
        }

        const coincideCon = (v: unknown, patrones: string[]) => {
          if (!esTextoValido(v)) return false
          const n = normalizar(aTexto(v))
          return patrones.some(p => n.startsWith(p) || n.includes(p))
        }

        // Buscar fila de encabezados
        let headerRow: string[] = []
        let filaDatosIdx = 0
        for (let i = 0; i < Math.min(filasRaw.length, 20); i++) {
          const row = (filasRaw[i] ?? []).filter(v => v != null && v !== '') as string[]
          const tieneItem = row.some(v => coincideCon(v, ['sku', 'codigo', 'cod', 'referencia', 'ref', 'parte', 'etiqueta']))
          const tieneCant = row.some(v => coincideCon(v, ['cant', 'qty', 'quantity', 'unidad', 'suma']))
          if (tieneItem && tieneCant) {
            headerRow = row
            filaDatosIdx = i + 1
            break
          }
        }

        if (headerRow.length === 0) {
          for (let i = 0; i < Math.min(filasRaw.length, 10); i++) {
            const row = (filasRaw[i] ?? []).filter(v => v != null && v !== '') as string[]
            if (row.length >= 3) {
              headerRow = row
              filaDatosIdx = i + 1
              break
            }
          }
        }

        if (headerRow.length === 0) {
          reject(new Error(
            `No se detectaron columnas requeridas.\n` +
            `Primeras filas encontradas:\n${
              filasRaw.slice(0, 3).map((r, i) =>
                `  Fila ${i + 1}: ${(r ?? []).filter(v => v != null).join(' | ')}`
              ).join('\n')
            }\n\n` +
            `El sistema busca:\n` +
            `• Ítem: sku, codigo, referencia, etiqueta\n` +
            `• Cantidad: cant, cantidad, qty, suma`
          ))
          return
        }

        // Mapear índices de columnas
        const idxItem = headerRow.findIndex(v => coincideCon(v, ['sku', 'codigo', 'cod', 'referencia', 'ref', 'parte', 'etiqueta']))
        const idxDesc = headerRow.findIndex(v => coincideCon(v, ['desc', 'nombre', 'producto', 'articulo', 'etiqueta']))
        const idxCant = headerRow.findIndex(v => coincideCon(v, ['cant', 'qty', 'quantity', 'unidad', 'suma']))
        const idxDoc = headerRow.findIndex(v => coincideCon(v, ['documento', 'nrodocumento', 'nro documento', 'planilla']))

        const idxSku = idxItem >= 0 ? idxItem : idxDesc

        const columnasDetectadas: Record<string, string> = {
          sku: headerRow[idxSku] ?? '—',
          descripcion: headerRow[idxDesc] ?? '—',
          cantidad: headerRow[idxCant] ?? '—',
          documento: idxDoc >= 0 ? headerRow[idxDoc] ?? '—' : '—',
        }

        // Parsear datos
        const items: ItemImportado[] = []
        for (let i = filaDatosIdx; i < filasRaw.length; i++) {
          const row = filasRaw[i] ?? []
          const itemLabel = aTexto(row[idxSku])
          const descLabel = idxDesc >= 0 && idxDesc !== idxSku ? aTexto(row[idxDesc]) : ''
          const valorCant = aTexto(row[idxCant]).replace(',', '.')
          const cantidadEsperada = Number(valorCant) || 0
          const docRef = idxDoc >= 0 ? aTexto(row[idxDoc]) : ''

          if (itemLabel === '' || cantidadEsperada <= 0) continue
          if (/^(total|subtotal|gran\s*total|∑)/i.test(itemLabel)) continue

          const sku = itemLabel
          const descripcion = descLabel || itemLabel
          items.push({ sku, descripcion, cantidad_esperada: cantidadEsperada, documentoRef: docRef || undefined })
        }

        if (items.length === 0) {
          reject(new Error(
            'No se encontraron ítems válidos en el archivo.\n' +
            `Encabezados detectados: ${headerRow.join(', ')}`
          ))
          return
        }

        // Agrupar por documento
        const grupos = agruparPorDocumento(items)

        resolve({ items, grupos, columnasDetectadas })
      } catch (err) {
        reject(new Error(`Error al parsear el archivo: ${err instanceof Error ? err.message : 'desconocido'}`))
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsArrayBuffer(archivo)
  })
}

function agruparPorDocumento(items: ItemImportado[]): GrupoPedidoImportado[] {
  // 1. Agrupar por documento
  const mapaDoc = new Map<string, ItemImportado[]>()
  for (const item of items) {
    const key = item.documentoRef || 'SIN_DOCUMENTO'
    const lista = mapaDoc.get(key) ?? []
    lista.push(item)
    mapaDoc.set(key, lista)
  }

  const grupos: GrupoPedidoImportado[] = []
  for (const [docRef, itemList] of mapaDoc) {
    // 2. Consolidar por SKU dentro del mismo documento (sumar cantidades)
    const mapaSku = new Map<string, ItemImportado>()
    for (const item of itemList) {
      const existente = mapaSku.get(item.sku)
      if (existente) {
        existente.cantidad_esperada += item.cantidad_esperada
      } else {
        mapaSku.set(item.sku, { ...item })
      }
    }
    const itemsConsolidados = Array.from(mapaSku.values())

    grupos.push({
      documentoRef: docRef === 'SIN_DOCUMENTO' ? '' : docRef,
      nombre: docRef === 'SIN_DOCUMENTO' ? 'Pedido sin documento' : docRef,
      items: itemsConsolidados,
      totalSkus: itemsConsolidados.length,
    })
  }
  return grupos
}

export async function exportarReporteExcel(pedido: ResumenPedido): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'MascotasCRM'
  workbook.created = new Date()

  // --- Hoja 1: Resumen ---
  const hojaResumen = workbook.addWorksheet('Resumen')
  hojaResumen.columns = [
    { header: 'Propiedad', key: 'prop', width: 25 },
    { header: 'Valor', key: 'val', width: 30 },
  ]

  hojaResumen.addRows([
    { prop: 'Pedido', val: pedido.nombre },
    { prop: 'Referencia CRM', val: pedido.crm_ref },
    { prop: 'Estado', val: pedido.estado },
    { prop: 'Operario', val: pedido.operario?.nombre ?? '—' },
    { prop: 'Total SKUs', val: pedido.total_skus },
    { prop: 'Peso Total (kg)', val: pedido.peso_total_kg },
    { prop: 'Tiempo Total (min)', val: pedido.tiempo_total_seg > 0 ? Math.floor(pedido.tiempo_total_seg / 60) + 'm ' + (pedido.tiempo_total_seg % 60) + 's' : '—' },
    { prop: 'Diferencia Total', val: pedido.total_diferencia },
    { prop: 'Ítems con Diferencia', val: pedido.items_con_diferencia },
    { prop: 'Creado', val: pedido.creado_en ? new Date(pedido.creado_en).toLocaleString('es-CL') : '—' },
    { prop: 'Iniciado', val: pedido.iniciado_en ? new Date(pedido.iniciado_en).toLocaleString('es-CL') : '—' },
    { prop: 'Finalizado', val: pedido.finalizado_en ? new Date(pedido.finalizado_en).toLocaleString('es-CL') : '—' },
  ])

  hojaResumen.getRow(1).font = { bold: true }
  hojaResumen.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E56A0' },
  }
  hojaResumen.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

  // --- Hoja 2: Detalle ---
  const hojaDetalle = workbook.addWorksheet('Detalle')
  hojaDetalle.columns = [
    { header: 'Orden', key: 'orden', width: 8 },
    { header: 'SKU', key: 'sku', width: 20 },
    { header: 'Descripción', key: 'desc', width: 40 },
    { header: 'Esperado', key: 'esp', width: 12 },
    { header: 'Confirmado', key: 'conf', width: 12 },
    { header: 'Diferencia', key: 'dif', width: 12 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Observaciones', key: 'obs', width: 30 },
  ]

  hojaDetalle.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  hojaDetalle.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E56A0' },
  }

  const pintarFila = (row: ExcelJS.Row, item: ItemPedido) => {
    if (item.estado === 'con_diferencia') {
      const diff = Math.abs((item.cantidad_confirmada ?? 0) - item.cantidad_esperada)
      const pct = item.cantidad_esperada > 0 ? diff / item.cantidad_esperada : 1
      if (pct > 0.1) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } }
      } else {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF8EC' } }
      }
    }
  }

  for (const item of pedido.items) {
    const confirmado = item.cantidad_confirmada ?? 0
    const diferencia = confirmado - item.cantidad_esperada
    const fila = hojaDetalle.addRow({
      orden: item.orden + 1,
      sku: item.sku,
      desc: item.descripcion,
      esp: item.cantidad_esperada,
      conf: confirmado,
      dif: diferencia,
      estado: item.estado,
      obs: item.observaciones,
    })
    pintarFila(fila, item)
  }

  // Fila de totales
  const filaTotal = hojaDetalle.addRow({
    orden: '',
    sku: 'TOTALES',
    desc: '',
    esp: pedido.items.reduce((a, i) => a + i.cantidad_esperada, 0),
    conf: pedido.items.reduce((a, i) => a + (i.cantidad_confirmada ?? 0), 0),
    dif: pedido.items.reduce((a, i) => a + ((i.cantidad_confirmada ?? 0) - i.cantidad_esperada), 0),
    estado: '',
    obs: '',
  })
  filaTotal.font = { bold: true }
  filaTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F6FA' } }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${pedido.crm_ref}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
