import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Usuario } from '../types'

interface AuthState {
  usuario: Usuario | null
  cargando: boolean
  inicializar: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  cargando: true,

  inicializar: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (data) {
          set({ usuario: data as Usuario, cargando: false })
          return
        }
      }
      set({ usuario: null, cargando: false })
    } catch {
      set({ usuario: null, cargando: false })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single()
        set({ usuario: data as Usuario ?? null })
      } else {
        set({ usuario: null })
      }
    })
  },

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) {
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id)
        .single()
      if (userData) {
        set({ usuario: userData as Usuario })
      }
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ usuario: null })
  },
}))
