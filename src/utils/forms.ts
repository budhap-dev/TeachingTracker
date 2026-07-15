/**
 * MUI's multi-select hands back an array normally, but a comma-joined string
 * when the browser autofills it. Normalise both into a list.
 */
export const parseSubjects = (value: string | string[]): string[] =>
    typeof value === 'string' ? value.split(',') : value
