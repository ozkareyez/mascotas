import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer(activo: boolean, segundosIniciales = 0) {
  const [segundos, setSegundos] = useState(segundosIniciales)
  const inicioRef = useRef<number | null>(null)
  const acumuladoRef = useRef(segundosIniciales)
  const frameRef = useRef<number | null>(null)

  const tick = useCallback(() => {
    if (inicioRef.current == null) return
    const ahora = Date.now()
    const transcurrido = Math.floor((ahora - inicioRef.current) / 1000)
    setSegundos(acumuladoRef.current + transcurrido)
    frameRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    if (activo) {
      inicioRef.current = Date.now()
      frameRef.current = requestAnimationFrame(tick)
    } else {
      if (inicioRef.current != null) {
        const ahora = Date.now()
        const transcurrido = Math.floor((ahora - inicioRef.current) / 1000)
        acumuladoRef.current += transcurrido
      }
      inicioRef.current = null
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }

    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [activo, tick])

  const tiempoFormateado = (() => {
    const s = Number.isFinite(segundos) ? Math.max(0, segundos) : 0
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  })()

  return { segundos, tiempoFormateado }
}
