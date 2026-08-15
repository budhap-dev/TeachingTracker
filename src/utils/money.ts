/**
 * Money, written the way the teacher and the families read it (REQ-055).
 *
 * Whole pounds: the app bills in whole pounds per session or per month, so
 * pennies would be noise. Shared, because a statement that formats money
 * differently from the payment tracker it mirrors would look like a different
 * figure.
 */
export const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0,
    }).format(value)
