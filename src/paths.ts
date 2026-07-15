/** Single source of truth for every route path in the app. */
export const paths = {
    dashboard: '/',
    students: '/students',
    studentDetail: (studentId: number | string) => `/students/${studentId}`,
    studySnapshot: '/study-snapshot',
    payments: '/payments',
    scheduling: '/scheduling',
    contact: '/contact',
} as const
