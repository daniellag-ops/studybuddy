const card: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: '24px',
  border: '1px solid var(--border)',
  boxShadow: '0 4px 18px var(--shadow)',
  boxSizing: 'border-box',
  width: '100%',
  transition: 'background-color 0.3s ease',
}

const WHY = [
  { emoji: '🎯', title: 'בנינו את זה גם בשבילנו', body: 'בתור תלמידים, אנחנו מבינים את הלחץ והקושי יותר מכל מבוגר אחר. הפתרון שלנו מגיע מתוך הרצון שלנו.' },
  { emoji: '💡', title: 'בלי סיבוכים, הכל במקום אחד', body: 'חלאס עם כל האפליקציות השונות. האפליקציה שלנו ברורה, אסתטית ועוזרת לכם להספיק יותר בפחות זמן.' },
  { emoji: '❤️', title: 'שומרים על המיינד', body: 'איזון בין לימודים לחופש הוא הכרחי. אנחנו כאן כדי להפוך את ניהול העומס לנגיש ופשוט עבור כולם.' },
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
        <p style={{ fontSize: '16px', color: 'var(--text-dim)', fontWeight: 600 }}>
          חמישה תלמידים. בעיה אחת. פתרון אחד.
        </p>
      </div>

      {/* Story card */}
      <div style={{ ...card, padding: '28px', marginBottom: '20px' }}>
        <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text)', marginBottom: '20px' }}>
          זיהינו את הבעיה שלנו בדור הזה- העומס של הלימודים ושילוב עם החיים הפרטיים. ראינו את הקושי שלנו ושל חברינו. הבנו שאף אחד לא יבנה עבורנו את האפליקציה שאנחנו באמת צריכים – אז בנינו אותו בעצמנו.
        </p>
        <p style={{ fontSize: '17px', fontWeight: 800, color: '#5b9bd5', fontStyle: 'italic' }}>
          StudyBuddy — פותח על ידי תלמידים, עבור תלמידים. 🚀
        </p>
      </div>

      {/* Team section */}
      <h2 style={{ fontSize: '22px', fontWeight: 800, fontStyle: 'italic', color: 'var(--text)', marginBottom: '12px' }}>
        הצוות
      </h2>
      <div style={{ ...card, padding: '20px 28px', marginBottom: '24px' }}>
        <p style={{ fontSize: '16px', color: 'var(--text)', fontWeight: 600 }}>
          מיה, אלה, נהורי ולילך — כיתה ח׳
        </p>
      </div>

      {/* Why section */}
      <h2 style={{ fontSize: '22px', fontWeight: 800, fontStyle: 'italic', color: 'var(--text)', marginBottom: '16px' }}>
        למה StudyBuddy?
      </h2>
      <div className="tips-grid" style={{ marginBottom: '24px' }}>
        {WHY.map(item => (
          <div key={item.title} style={{ ...card, padding: '24px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>{item.emoji}</div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
              {item.title}
            </h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-dim)' }}>
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
          marginBottom: '16px',
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
