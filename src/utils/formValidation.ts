/**
 * The one required-field treatment every form shares (REQ-029).
 *
 * A required field always shows a `*` on its label; the red border and the
 * short message appear only once a submit has been attempted and the field is
 * still empty — "on submit", never while the form is being typed into.
 *
 * Spread the result onto an MUI `TextField` (plain, `select`, or an
 * Autocomplete's `renderInput` field): `required` draws the `*`, `error` the
 * red border, `helperText` the message.
 *
 *   <TextField
 *     label="First Name"
 *     {...requiredFieldProps(submitted && !form.firstName, 'First name is required')}
 *   />
 */
export const requiredFieldProps = (
    showError: boolean,
    message: string
): { required: true; error: boolean; helperText: string | undefined } => ({
    required: true,
    error: showError,
    helperText: showError ? message : undefined,
})

/**
 * Format checks for the optional contact fields (REQ-029). Blank is always
 * fine — these fields are removable by design — but a value that's present
 * must look right before it's saved onto the public page.
 */
export const isValidEmail = (value: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

/** Digits with optional +, spaces, dashes or brackets; at least 7 digits. */
export const isValidPhone = (value: string): boolean =>
    /^\+?[\d\s()-]*$/.test(value) && (value.match(/\d/g) ?? []).length >= 7
