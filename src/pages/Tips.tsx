import { useState } from 'react'

type Category = 'הכל' | 'לימודים' | 'בריאות' | 'חברתי' | 'נפשי'

interface Tip {
  emoji: string
  title: string
  description: string
  category: Exclude<Category, 'הכל'>
  borderColor: string
}

const TIPS: Tip[] = [
  { emoji: '📖', title: 'שיטת הפומודורו', description: '25 דקות לימוד, 5 דקות הפסקה. שיטה מוכחת שמשפרת ריכוז ומונעת שחיקה. נסו 4 סיבובים ואחריהם הפסקה ארוכה של 20 דקות.', category: 'לימודים', borderColor: '#3581b8' },
  { emoji: '🧠', title: 'למדו בקול', description: 'קריאה בקול רם משפרת זיכרון ב-50%. הסבירו חומר לעצמכם כאילו אתם מלמדים מישהו אחר — זה הכי יעיל!', category: 'לימודים', borderColor: '#3581b8' },
  { emoji: '📝', title: 'סיכומים ויזואליים', description: 'מפות חשיבה וסיכומים ויזואליים עוזרים לזכור יותר מטקסט רגיל. השתמשו בצבעים, חיצים וציורים פשוטים.', category: 'לימודים', borderColor: '#3581b8' },
  { emoji: '🎯', title: 'התחילו מהקשה', description: 'עשו את המשימה הכי קשה כשהאנרגיה שלכם בשיאה — בדרך כלל בבוקר. כשתסיימו אותה, הכל ייראה קל יותר.', category: 'לימודים', borderColor: '#3581b8' },
  { emoji: '📱', title: 'הטלפון בצד', description: 'שמירת הטלפון מחוץ לשדה הראייה מפחיתה הסחות דעת ב-20%. השתמשו במצב "אל תפריע" בזמן לימוד.', category: 'לימודים', borderColor: '#3581b8' },
  { emoji: '💤', title: '8-10 שעות שינה', description: 'בגיל שלכם הגוף זקוק ל-8-10 שעות שינה. שינה מספקת משפרת ריכוז, זיכרון, ומצב רוח. אל תוותרו על שינה!', category: 'בריאות', borderColor: '#3aaa6d' },
  { emoji: '🥗', title: 'ארוחת בוקר חובה', description: 'ארוחת בוקר היא ה"דלק" של המוח. תלמידים שאוכלים בוקר מגיעים לציונים גבוהים יותר ב-20% בממוצע.', category: 'בריאות', borderColor: '#3aaa6d' },
  { emoji: '💧', title: 'שתו מים', description: 'שתו 8 כוסות מים ביום. התייבשות קלה מספיקה כדי לפגוע בריכוז ובביצועים. קחו בקבוק מים לבית הספר.', category: 'בריאות', borderColor: '#3aaa6d' },
  { emoji: '🏃', title: '30 דקות תנועה', description: '30 דקות פעילות גופנית ביום משפרות ריכוז, מפחיתות מתח, ומשפרות שינה. אפילו הליכה נחשבת!', category: 'בריאות', borderColor: '#3aaa6d' },
  { emoji: '👀', title: 'חוק 20-20-20', description: 'כל 20 דקות מול מסך, הסתכלו 20 שניות על משהו במרחק 20 רגל (6 מטר). מונע עייפות עיניים.', category: 'בריאות', borderColor: '#3aaa6d' },
  { emoji: '👫', title: 'למידה בזוגות', description: 'למידה עם חבר משפרת הבנה וזיכרון. הסבירו זה לזה חומר, בדקו אחד את השני, ולמדו ביחד לבחינות.', category: 'חברתי', borderColor: '#c44daa' },
  { emoji: '🤝', title: 'תנו מחמאות', description: 'מחמאה אמיתית ביום יכולה לשנות את היום של מישהו. זה גם משפר את מצב הרוח שלכם — נסו!', category: 'חברתי', borderColor: '#c44daa' },
  { emoji: '📵', title: 'זמן איכות אמיתי', description: 'כשאתם עם חברים, שימו את הטלפון בצד. שיחה אמיתית פנים אל פנים חזקה פי 10 מכל אינטראקציה דיגיטלית.', category: 'חברתי', borderColor: '#c44daa' },
  { emoji: '🗣️', title: 'תדברו על זה', description: 'אם משהו מציק לכם — דברו עם חבר, הורה, או מורה שאתם סומכים עליהם. לא צריך לשאת הכל לבד.', category: 'חברתי', borderColor: '#c44daa' },
  { emoji: '🧘', title: 'נשימות 4-7-8', description: 'שאפו 4 שניות, עצרו 7, נשפו 8. חזרו 3 פעמים. מוריד מתח ולחץ מיידית — מצוין לפני בחינה.', category: 'נפשי', borderColor: '#d4960a' },
  { emoji: '📓', title: 'יומן הכרת תודה', description: 'כתבו 3 דברים שאתם מכירים בהם תודה כל יום. מחקרים מראים שזה משפר אושר ומפחית חרדה תוך שבועות.', category: 'נפשי', borderColor: '#d4960a' },
  { emoji: '🎵', title: 'מוזיקה מרגיעה', description: 'מוזיקה בטמפו 60-80 פעימות לדקה (כמו מוזיקה קלאסית) עוזרת לריכוז ולהרגעה. נסו ספוטיפיי "focus".', category: 'נפשי', borderColor: '#d4960a' },
  { emoji: '🌿', title: 'צאו לטבע', description: '20 דקות בטבע מפחיתות הורמוני מתח ב-21%. פארק, גינה, או אפילו ישיבה ליד חלון פתוח — הכל עוזר.', category: 'נפשי', borderColor: '#d4960a' },
  { emoji: '🎨', title: 'תחביב = תרופה', description: 'תחביב שאתם אוהבים — ציור, מוזיקה, ספורט, בישול — הוא אחד הכלים הכי יעילים נגד לחץ. הקדישו לו זמן.', category: 'נפשי', borderColor: '#d4960a' },
  { emoji: '⏸️', title: 'זה בסדר לעצור', description: 'לא כל יום צריך להיות פרודוקטיבי. לפעמים הגוף והנפש צריכים יום מנוחה. הקשיבו לעצמכם.', category: 'נפשי', borderColor: '#d4960a' },
]

const FILTER_TABS: { label: Category; emoji: string }[] = [
  { label: 'הכל', emoji: '🌟' },
  { label: 'לימודים', emoji: '📖' },
  { label: 'בריאות', emoji: '💪' },
  { label: 'חברתי', emoji: '👫' },
  { label: 'נפשי', emoji: '🧠' },
]

export default function Tips() {
  const [activeFilter, setActiveFilter] = useState<Category>('הכל')
  const filtered = TIPS.filter(t => activeFilter === 'הכל' || t.category === activeFilter)

  return (
    <div
      className="fade-in"
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', width: '100%', boxSizing: 'border-box' }}
    >
      <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#2a3b33', marginBottom: '24px' }}>
        💡 טיפים
      </h1>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {FILTER_TABS.map(({ label, emoji }) => (
          <button
            key={label}
            onClick={() => setActiveFilter(label)}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: activeFilter === label ? 'linear-gradient(135deg, #228b78, #2ba08a)' : 'rgba(34,139,120,0.06)',
              color: activeFilter === label ? 'white' : '#5a8a78',
              border: activeFilter === label ? 'none' : '1px solid rgba(34,139,120,0.15)',
              boxSizing: 'border-box',
            }}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Tips grid — responsive via CSS class in index.css */}
      <div className="tips-grid">
        {filtered.map((tip, i) => (
          <div
            key={i}
            className="tip-card"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'white',
              borderRadius: '18px',
              padding: '24px',
              border: '1px solid rgba(34,139,120,0.08)',
              boxShadow: '0 2px 12px rgba(34,139,120,0.06)',
              borderTop: `3px solid ${tip.borderColor}`,
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{tip.emoji}</div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2a3b33', marginBottom: '8px' }}>
              {tip.title}
            </h3>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#5a8a78' }}>
              {tip.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
