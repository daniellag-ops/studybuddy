const card: React.CSSProperties = {
  background: 'white',
  borderRadius: '24px',
  border: '1px solid rgba(91,155,213,0.12)',
  boxShadow: '0 4px 18px rgba(91,155,213,0.1)',
  boxSizing: 'border-box',
  width: '100%',
}

const WHY = [
  { emoji: '🎯', title: 'תכל\'ס, בנינו את זה בשבילנו', body: 'כמי שנמצאים בתוך המערכת, אנחנו מבינים את הלחץ מקרוב. הפתרון שלנו מגיע מתוך הצורך האמיתי שלנו.' },
  { emoji: '💡', title: 'מקסימום תוצאה, אפס מאמץ', body: 'חלאס עם ממשקים מסובכים. הכלים שלנו חדים, נקיים ועוזרים לכם להספיק יותר בפחות זמן.' },
  { emoji: '❤️', title: 'שומרים על המיינד', body: 'איזון בין לימודים לנפש הוא הכרחי. אנחנו כאן כדי להפוך את ניהול העומס לנגיש ופשוט עבור כולם.' },
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
          זיהינו את האתגר של דורנו: העומס הבלתי פוסק של הלימודים והחיים האישיים. ראינו את הקושי בעיניים של החברים שלנו, והרגשנו אותו בעצמנו. הבנו שאף אחד לא יבנה עבורנו את הכלי שאנחנו באמת צריכים – אז בנינו אותו בעצמנו.
        </p>
        <p style={{ fontSize: '17px', fontWeight: 800, color: '#5b9bd5', fontStyle: 'italic' }}>
          StudyBuddy — פותח על ידי תלמידים, עבור תלמידים. 🚀
        </p>
      </div>

      {/* Team section */}
      <h2 style={{ fontSize: '22px', fontWeight: 800, fontStyle: 'italic', color: '#2a3a4a', marginBottom: '12px' }}>
        הצוות
      </h2>
      <div style={{ ...card, padding: '20px 28px', marginBottom: '24px' }}>
        <p style={{ fontSize: '16px', color: '#2a3a4a', fontWeight: 600 }}>
          מיה, אלה, נהורי, לילך ונתנאל — כיתה ח׳
        </p>
      </div>

      {/* Why section */}
      <h2 style={{ fontSize: '22px', fontWeight: 800, fontStyle: 'italic', color: '#2a3a4a', marginBottom: '16px' }}>
        למה StudyBuddy?
      </h2>
      <div className="tips-grid" style={{ marginBottom: '24px' }}>
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
