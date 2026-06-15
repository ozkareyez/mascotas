import { useRef, useState } from 'react'

interface UploadZoneProps {
  onArchivo: (archivo: File) => void
  aceptar?: string
}

export function UploadZone({ onArchivo, aceptar = '.xlsx,.xls,.csv' }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file: File) => {
    onArchivo(file)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
      style={{
        border: `2px dashed ${dragging ? 'var(--orange)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: 40,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        background: dragging ? 'var(--orange-bg)' : 'var(--white)',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={aceptar}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: 4 }}>
        {dragging ? 'Suelta el archivo aquí' : 'Subir archivo Excel'}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
        Arrastra o haz clic para seleccionar .xlsx, .xls o .csv
      </div>
    </div>
  )
}
