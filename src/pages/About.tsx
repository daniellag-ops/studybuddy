const card: React.CSSProperties = {
  background: 'white',
  borderRadius: '24px',
  border: '1px solid rgba(91,155,213,0.12)',
  boxShadow: '0 4px 18px rgba(91,155,213,0.1)',
  boxSizing: 'border-box',
  width: '100%',
}

const TEAM = [
  { name: 'מאיה', color: '#5b9bd5' },
  { name: 'אלה', color: '#4a8ac7' },
  { name: 'נהורי', color: '#228b78' },
  { name: 'לילך', color: '#d4960a' },
  { name: 'נתנאל', color: '#e05555' },
]

const WHY = [
  { emoji: '🎯', title: 'בנינו את זה בשבילנו', body: 'אנחנו תלמידים בדיוק כמוכם. אנחנו מבינים את האתגרים כי אנחנו חיים אותם כל יום.' },
  { emoji: '💡', title: 'פשוט ויעיל', body: 'בלי סיבוכים מיותרים. כלים פשוטים שעובדים ועוזרים באמת.' },
  { emoji: '❤️', title: 'בריאות זה לא מותרות', body: 'ניהול עומס ואורח חיים בריא צריכים להיות נגישים לכל תלמיד.' },
]

export default function About() {
  return (
    <div
      className="fade-in"
      style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', width: '100%', boxSizing: 'border-box' }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 900, fontStyle: 'italic', color: '#5b9bd5', marginBottom: '8px' }}>
          מי אנחנו?
        </h1>
        <p style={{ fontSize: '16px', color: '#6a8a9a', fontWeight: 600 }}>
          חמישה תלמידים. בעיה אחת. פתרון אחד.
        </p>
      </div>

      {/* Story card */}
      <div style={{ ...card, padding: '28px', marginBottom: '20px' }}>
        <p style={{ fontSize: '16px', lineHeight: 1.8, color: '#2a3a4a', marginBottom: '20px' }}>
          ראינו שכולם סביבנו — חברים, תלמידים, אנחנו עצמנו — טובעים בעומס. שיעורי בית, מבחנים, חוגים, וחיים שלמים שצריך לנהל. אז החלטנו לעשות משהו עם זה. לא חיכינו שמישהו יבנה את הפתרון. בנינו אותו בעצמנו.
        </p>
        <p style={{ fontSize: '17px', fontWeight: 800, color: '#5b9bd5', fontStyle: 'italic' }}>
          StudyBuddy — מתלמידים, בשביל תלמידים. 🚀
        </p>
      </div>

      {/* Team section */}
      <h2 style={{ fontSize: '22px', fontWeight: 800, fontStyle: 'italic', color: '#2a3a4a', marginBottom: '16px' }}>
        הצוות
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
          marginBottom: '24px',
          width: '100%',
        }}
      >
        {TEAM.map(member => (
          <div
            key={member.name}
            style={{ ...card, padding: '20px 12px', textAlign: 'center' }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: member.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '26px',
                fontWeight: 800,
                color: 'white',
                boxShadow: `0 4px 14px ${member.color}55`,
              }}
            >
              {member.name[0]}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#2a3a4a', marginBottom: '4px' }}>
              {member.name}
            </div>
            <div style={{ fontSize: '11px', color: '#6a8a9a', fontWeight: 600 }}>
              שותף/ה מייסד/ת
            </div>
          </div>
        ))}
      </div>

      {/* Why section */}
      <h2 style={{ fontSize: '22px', fontWeight: 800, fontStyle: 'italic', color: '#2a3a4a', marginBottom: '16px' }}>
        למה StudyBuddy?
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px',
          width: '100%',
        }}
      >
        {WHY.map(item => (
          <div key={item.title} style={{ ...card, padding: '24px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>{item.emoji}</div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2a3a4a', marginBottom: '8px' }}>
              {item.title}
            </h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#6a8a9a' }}>
              {item.body}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          ...card,
          padding: '28px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #5b9bd5 0%, #4a8ac7 100%)',
          border: 'none',
        }}
      >
        <p style={{ fontSize: '17px', fontWeight: 800, color: 'white', marginBottom: '10px', lineHeight: 1.6 }}>
          כי אם לא אנחנו — אז מי? ואם לא עכשיו — אז מתי?
        </p>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
          אנחנו 5 תלמידים מכיתה ח׳ שהחליטו שאפשר לנהל את החיים אחרת.
        </p>
      </div>
    </div>
  )
}
