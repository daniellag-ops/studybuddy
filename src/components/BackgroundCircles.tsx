export default function BackgroundCircles() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        maxWidth: '100vw',
      }}
    >
      <div
        className="bg-circle-1"
        style={{
          position: 'absolute',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          opacity: 0.18,
          filter: 'blur(60px)',
          background: '#2ba08a',
          top: '-80px',
          right: '-40px',
        }}
      />
      <div
        className="bg-circle-2"
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          opacity: 0.13,
          filter: 'blur(60px)',
          background: '#3581b8',
          bottom: '10%',
          left: '-40px',
        }}
      />
      <div
        className="bg-circle-3"
        style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          opacity: 0.13,
          filter: 'blur(60px)',
          background: '#3aaa6d',
          top: '40%',
          right: '30%',
        }}
      />
    </div>
  )
}
