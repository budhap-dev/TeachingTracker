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
