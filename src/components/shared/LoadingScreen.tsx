export function LoadingScreen() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 32,
      }}
    >
      <div className="spinner" />
      <span style={{ color: 'var(--text2)', fontSize: '14px' }}>Cargando...</span>
    </div>
  )
}
