import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const CSV_PATH = new URL('usuarios.csv', import.meta.url).pathname

if (!SERVICE_ROLE_KEY) {
  console.error('Error: Necesitás la SERVICE_ROLE_KEY')
  console.error('1. Andá a Project Settings → API en Supabase')
  console.error('2. Copiá la "service_role key"')
  console.error('3. Ejecutá: SUPABASE_SERVICE_ROLE_KEY=tu_key node supabase/crear_usuarios.mjs')
  process.exit(1)
}

if (!SUPABASE_URL) {
  console.error('Error: VITE_SUPABASE_URL no está definida')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const lines = readFileSync(CSV_PATH, 'utf-8').trim().split('\n')

for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(';')
  const email = cols[0]
  const password = cols[1]
  const nombre = cols[2] || email.split('@')[0]
  const rol = cols[3] || 'operario'

  if (!password || password === 'COLOCA_CONTRASEÑA_AQUI') {
    console.warn(`⚠️  Saltando ${email}: coloca una contraseña en usuarios.csv`)
    continue
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol },
  })

  if (error) {
    console.error(`✗ ${email}:`, error.message)
  } else {
    console.log(`✓ ${email} creado (id: ${data.user.id})`)
  }
}

console.log('\n✅ Listo')
