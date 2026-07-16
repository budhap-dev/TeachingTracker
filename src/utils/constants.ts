export type ThemeName =
    | 'mono'
    | 'ocean'
    | 'sunset'
    | 'forest'
    | 'midnight'
    | 'lavender'
    | 'coral'
    | 'sage'
    | 'amber'
    | 'berry'
    | 'slate'
    | 'spring'
    | 'summer'
    | 'autumn'
    | 'winter'

export type ThemePreset = {
    label: string
    accent: string
    accentAlt: string
    sidebar: string
    primary: string
    secondary: string
}

export const themePresets: Record<ThemeName, ThemePreset> = {
    // First in the picker and the default: white, black and greys — the quiet
    // professional face; every other theme is an opt-in splash of colour.
    mono: {
        label: 'Mono',
        accent: '#111827',
        accentAlt: '#6b7280',
        sidebar: 'linear-gradient(180deg, #09090b, #3f3f46)',
        primary: '#111827',
        secondary: '#52525b',
    },
    ocean: {
        label: 'Ocean',
        accent: '#2563eb',
        accentAlt: '#4f46e5',
        sidebar: 'linear-gradient(180deg, #0f172a, #1d4ed8)',
        primary: '#2563eb',
        secondary: '#4f46e5',
    },
    sunset: {
        label: 'Sunset',
        accent: '#ea580c',
        accentAlt: '#d946ef',
        sidebar: 'linear-gradient(180deg, #431407, #b45309)',
        primary: '#ea580c',
        secondary: '#d946ef',
    },
    forest: {
        label: 'Forest',
        accent: '#15803d',
        accentAlt: '#0f766e',
        sidebar: 'linear-gradient(180deg, #052e16, #166534)',
        primary: '#15803d',
        secondary: '#0f766e',
    },
    midnight: {
        label: 'Midnight',
        accent: '#6366f1',
        accentAlt: '#8b5cf6',
        sidebar: 'linear-gradient(180deg, #020617, #312e81)',
        primary: '#6366f1',
        secondary: '#8b5cf6',
    },
    lavender: {
        label: 'Lavender',
        accent: '#7c3aed',
        accentAlt: '#ec4899',
        sidebar: 'linear-gradient(180deg, #2e1065, #7c3aed)',
        primary: '#7c3aed',
        secondary: '#ec4899',
    },
    coral: {
        label: 'Coral',
        accent: '#f43f5e',
        accentAlt: '#fb923c',
        sidebar: 'linear-gradient(180deg, #4c0519, #be123c)',
        primary: '#f43f5e',
        secondary: '#fb923c',
    },
    sage: {
        label: 'Sage',
        accent: '#4d7c0f',
        accentAlt: '#65a30d',
        sidebar: 'linear-gradient(180deg, #111827, #4d7c0f)',
        primary: '#4d7c0f',
        secondary: '#65a30d',
    },
    amber: {
        label: 'Amber',
        accent: '#d97706',
        accentAlt: '#f59e0b',
        sidebar: 'linear-gradient(180deg, #451a03, #92400e)',
        primary: '#d97706',
        secondary: '#f59e0b',
    },
    berry: {
        label: 'Berry',
        accent: '#db2777',
        accentAlt: '#8b5cf6',
        sidebar: 'linear-gradient(180deg, #2d0a1d, #7e22ce)',
        primary: '#db2777',
        secondary: '#8b5cf6',
    },
    slate: {
        label: 'Slate',
        accent: '#475569',
        accentAlt: '#64748b',
        sidebar: 'linear-gradient(180deg, #0f172a, #334155)',
        primary: '#475569',
        secondary: '#64748b',
    },
    spring: {
        label: 'Spring',
        accent: '#0f766e',
        accentAlt: '#84cc16',
        sidebar: 'linear-gradient(180deg, #022c22, #0f766e)',
        primary: '#0f766e',
        secondary: '#84cc16',
    },
    summer: {
        label: 'Summer',
        accent: '#0284c7',
        accentAlt: '#f59e0b',
        sidebar: 'linear-gradient(180deg, #082f49, #0f766e)',
        primary: '#0284c7',
        secondary: '#f59e0b',
    },
    autumn: {
        label: 'Autumn',
        accent: '#b45309',
        accentAlt: '#a16207',
        sidebar: 'linear-gradient(180deg, #431407, #92400e)',
        primary: '#b45309',
        secondary: '#a16207',
    },
    winter: {
        label: 'Winter',
        accent: '#2563eb',
        accentAlt: '#38bdf8',
        sidebar: 'linear-gradient(180deg, #0f172a, #1d4ed8)',
        primary: '#2563eb',
        secondary: '#38bdf8',
    },
}

export const teacherQuotes = [
    'A teacher affects eternity; he can never tell where his influence stops. - Henry Adams',
    'The mediocre teacher tells. The good teacher explains. The superior teacher demonstrates. The great teacher inspires. - William Arthur Ward',
    'One child, one teacher, one book, one pen can change the world. - Malala Yousafzai',
    'A good teacher can inspire hope, ignite the imagination, and instill a love of learning. - Brad Henry',
    'The dream begins with a teacher who believes in you. - Dan Rather',
    'You cannot teach a man anything; you can only help him find it within himself. - Dale Carnegie',
    'A teacher who is attempting to teach without inspiring the pupil with a desire to learn is hammering on cold iron. - Horace Mann',
    'It is the supreme art of the teacher to awaken joy in creative expression and knowledge. - Albert Einstein',
    'The beautiful thing about learning is that nobody can take it away from you. - B.B. King',
    'I like a teacher who gives you something to take home to think about besides homework. - Lily Tomlin',
    'One looks back with appreciation to the brilliant teachers, but with gratitude to those who touched our human feelings. - Carl Jung',
    'The whole purpose of education is to turn mirrors into windows. - Sydney J. Harris',
    'Tell me and I forget. Teach me and I remember. Involve me and I learn. - Xunzi',
    'The mind is not a vessel to be filled but a fire to be kindled. - Plutarch',
    'Education is not the filling of a pail, but the lighting of a fire. - William Butler Yeats',
    'The art of teaching is the art of assisting discovery. - Mark Van Doren',
    'Teachers can change lives with just the right mix of chalk and challenges. - Joyce Meyer',
    'It is important that students question what is known, not worship it. - Jacob Bronowski',
    'Good teaching is more a giving of right questions than a giving of right answers. - Josef Albers',
    'What we want is to see the child in pursuit of knowledge, and not knowledge in pursuit of the child. - George Bernard Shaw',
    'Education is what survives when what has been learned has been forgotten. - B.F. Skinner',
    'He who opens a school door, closes a prison. - Victor Hugo',
    'The task of the modern educator is not to cut down jungles, but to irrigate deserts. - C.S. Lewis',
    'I touch the future. I teach. - Christa McAuliffe',
    'One good teacher in a lifetime may sometimes change a delinquent into a solid citizen. - Philip Wylie',
    'If you have to put someone on a pedestal, put teachers. They are society’s heroes. - Guy Kawasaki',
    'Teaching is the one profession that creates all other professions. - Unknown',
    'The influence of a good teacher can never be erased. - Unknown',
    'Students don’t care how much you know until they know how much you care. - Theodore Roosevelt',
    'A great teacher takes a hand, opens a mind, and touches a heart. - Unknown',
    'The best teachers are those who show you where to look, but do not tell you what to see. - Alexandra K. Trenfor',
    'To teach is to learn twice. - Joseph Joubert',
    'A teacher is one who makes himself progressively unnecessary. - Thomas Carruthers',
    'Those who know, do. Those that understand, teach. - Aristotle',
    'Education is the key to success in life, and teachers make a lasting impact in the lives of their students. - Solomon Ortiz',
    'The art of teaching is the art of awakening the natural curiosity of young minds. - Anatole France',
    'A great teacher is a great artist because education is the art of shaping human potential. - John Steinbeck',
    'Better than a thousand days of diligent study is one day with a great teacher. - Japanese Proverb',
    'The true teacher defends his pupils against his own personal influence. - Amos Bronson Alcott',
    'What the teacher is, is more important than what he teaches. - Karl Menninger',
]

/** Subjects a student can be taught. Shared by the add form and the detail page. */
export const subjectOptions = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'History',
]

/** School years 6–13. */
export const yearOptions = Array.from({ length: 8 }, (_, index) =>
    String(index + 6)
)
