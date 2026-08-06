/** Single source of truth for every route path in the app. */
export const paths = {
    dashboard: '/',
    students: '/students',
    studentDetail: (studentId: number | string) => `/students/${studentId}`,
    studentDiary: (studentId: number | string) =>
        `/students/${studentId}/diary`,
    studySnapshot: '/study-snapshot',
    alumni: '/alumni',
    payments: '/payments',
    scheduling: '/scheduling',
    offerings: '/offerings',
    enquire: '/enquire',
    leads: '/leads',
    siteEditor: '/site-editor',
    contact: '/contact',
    privacy: '/privacy',
    faq: '/faq',
    pricing: '/pricing',
    reviews: '/reviews',
    reviewsModeration: '/reviews/moderation',
} as const
