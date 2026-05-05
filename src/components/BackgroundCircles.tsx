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
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          opacity: 0.22,
          filter: 'blur(70px)',
          background: '#5b9bd5',
          top: '-100px',
          right: '-60px',
        }}
      />
      <div
        className="bg-circle-2"
        style={{
          position: 'absolute',
          width: '340px',
          height: '340px',
          borderRadius: '50%',
          opacity: 0.15,
          filter: 'blur(65px)',
          background: '#7bb8e8',
          bottom: '10%',
          left: '-50px',
        }}
      />
      <div
        className="bg-circle-3"
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          opacity: 0.14,
          filter: 'blur(60px)',
          background: '#4a8ac7',
          top: '40%',
          right: '30%',
        }}
      />
    </div>
  )
}
