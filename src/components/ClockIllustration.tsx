export default function ClockIllustration() {
  const cx = 100
  const cy = 100
  const faceR = 66

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180)
    const isMajor = i % 3 === 0
    const r1 = isMajor ? 52 : 57
    const r2 = 63
    return {
      x1: cx + r1 * Math.cos(angle),
      y1: cy + r1 * Math.sin(angle),
      x2: cx + r2 * Math.cos(angle),
      y2: cy + r2 * Math.sin(angle),
      isMajor,
    }
  })

  return (
    <div style={{ position: 'relative', width: 200, height: 200, display: 'inline-block' }}>
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        {/* Outer decorative circle */}
        <circle cx={cx} cy={cy} r="88" fill="#e8f3fd" stroke="#c5d9ed" strokeWidth="1.5" />

        {/* Clock face */}
        <circle cx={cx} cy={cy} r={faceR} fill="white" stroke="#5b9bd5" strokeWidth="3" />

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="#5b9bd5"
            strokeWidth={t.isMajor ? 2.5 : 1.5}
            strokeLinecap="round"
          />
        ))}

        {/* Hour hand — 10:10 → hour at 305° */}
        <line
          x1="100" y1="100" x2="100" y2="63"
          stroke="#2a3a4a" strokeWidth="4" strokeLinecap="round"
          transform="rotate(305, 100, 100)"
        />

        {/* Minute hand — 10 min → 60° */}
        <line
          x1="100" y1="100" x2="100" y2="49"
          stroke="#5b9bd5" strokeWidth="3" strokeLinecap="round"
          transform="rotate(60, 100, 100)"
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="5" fill="#5b9bd5" />
        <circle cx={cx} cy={cy} r="2.5" fill="white" />
      </svg>

      {/* Corner emoji icons */}
      <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 26, lineHeight: 1, userSelect: 'none' }}>🧠</span>
      <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 26, lineHeight: 1, userSelect: 'none' }}>📋</span>
      <span style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 26, lineHeight: 1, userSelect: 'none' }}>📖</span>
      <span style={{ position: 'absolute', bottom: 4, right: 4, fontSize: 26, lineHeight: 1, userSelect: 'none' }}>❤️</span>
    </div>
  )
}
