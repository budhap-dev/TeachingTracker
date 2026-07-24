import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    ListItemText,
    MenuItem,
    TextField,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Student } from '../data/students'
import { subjectOptions, yearOptions } from '../utils/constants'
import { requiredFieldProps } from '../utils/formValidation'

type StudentFormModalProps = {
    open: boolean
    form: Omit<Student, 'id'>
    onClose: () => void
    onChange: (
        field: keyof Omit<Student, 'id'>,
        value: string | number | string[]
    ) => void
    onSubmit: (event: FormEvent) => void
}

export const StudentFormModal = ({
    open,
    form,
    onClose,
    onChange,
    onSubmit,
}: StudentFormModalProps) => {
    // Errors show only after a save is attempted (REQ-029, on-submit). Cleared
    // whenever the modal reopens, so a fresh Add starts without red fields.
    const [submitted, setSubmitted] = useState(false)
    useEffect(() => {
        if (open) setSubmitted(false)
    }, [open])

    const handleSubmit = (event: FormEvent) => {
        setSubmitted(true)
        // The parent validates the same required set and only closes on success,
        // so an invalid submit leaves the modal open with its errors showing.
        onSubmit(event)
    }

    return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        {/* Primary action lives in the header: save top-right, ✕ to dismiss —
            no Cancel button. The scheduling modal follows the same shape. */}
        <DialogTitle className="modal-header">
            Add a new student
            <span className="modal-header-actions">
                <Button
                    type="submit"
                    form="student-form"
                    variant="contained"
                    size="small"
                >
                    Save student
                </Button>
                <IconButton aria-label="Close" size="small" onClick={onClose}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </span>
        </DialogTitle>
        <DialogContent>
            <Box
                component="form"
                id="student-form"
                onSubmit={handleSubmit}
                className="student-form modal-form"
                noValidate
            >
                <TextField
                    label="First Name"
                    size="small"
                    value={form.firstName}
                    onChange={(event) =>
                        onChange('firstName', event.target.value)
                    }
                    {...requiredFieldProps(
                        submitted && !form.firstName,
                        'First name is required'
                    )}
                    fullWidth
                />
                <TextField
                    label="Last Name"
                    size="small"
                    value={form.lastName}
                    onChange={(event) =>
                        onChange('lastName', event.target.value)
                    }
                    {...requiredFieldProps(
                        submitted && !form.lastName,
                        'Last name is required'
                    )}
                    fullWidth
                />
                <TextField
                    label="Date of Birth"
                    size="small"
                    type="date"
                    value={form.dob}
                    onChange={(event) => onChange('dob', event.target.value)}
                    // A date input always draws its own control, so its label
                    // must shrink or it sits on top of "dd/mm/yyyy".
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                />
                <TextField
                    select
                    label="Year"
                    size="small"
                    value={form.year}
                    onChange={(event) => onChange('year', event.target.value)}
                    {...requiredFieldProps(
                        submitted && !form.year,
                        'Year is required'
                    )}
                    fullWidth
                >
                    {yearOptions.map((year) => (
                        <MenuItem key={year} value={year}>
                            {year}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    label="Subjects"
                    size="small"
                    className="span-2"
                    value={form.subjects}
                    slotProps={{
                        select: {
                            multiple: true,
                            renderValue: (selected) =>
                                (selected as string[]).join(', '),
                        },
                    }}
                    onChange={(event) =>
                        onChange(
                            'subjects',
                            // With multiple, MUI hands back the array.
                            event.target.value as unknown as string[]
                        )
                    }
                    {...requiredFieldProps(
                        submitted && form.subjects.length === 0,
                        'Pick at least one subject'
                    )}
                    fullWidth
                >
                    {subjectOptions.map((subject) => (
                        <MenuItem key={subject} value={subject}>
                            <Checkbox
                                checked={form.subjects.includes(subject)}
                            />
                            <ListItemText primary={subject} />
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    label="School"
                    size="small"
                    value={form.school}
                    onChange={(event) => onChange('school', event.target.value)}
                    {...requiredFieldProps(
                        submitted && !form.school,
                        'School is required'
                    )}
                    fullWidth
                />
                <TextField
                    select
                    label="Study mode"
                    size="small"
                    value={form.mode}
                    onChange={(event) => onChange('mode', event.target.value)}
                    fullWidth
                >
                    <MenuItem value="Online">Online</MenuItem>
                    <MenuItem value="Face to Face">Face to Face</MenuItem>
                    <MenuItem value="Both">Online + F2F</MenuItem>
                </TextField>
                <TextField
                    label="Progress %"
                    size="small"
                    type="number"
                    value={form.progress}
                    onChange={(event) =>
                        onChange('progress', Number(event.target.value))
                    }
                    fullWidth
                />
                <TextField
                    select
                    label="Fee type"
                    size="small"
                    value={form.feeType ?? 'per-session'}
                    onChange={(event) => onChange('feeType', event.target.value)}
                    fullWidth
                >
                    <MenuItem value="per-session">Per session</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="none">No fee</MenuItem>
                </TextField>
                {(form.feeType ?? 'per-session') !== 'none' && (
                    <TextField
                        label={
                            form.feeType === 'monthly'
                                ? 'Monthly fee (£)'
                                : 'Fee per session (£)'
                        }
                        size="small"
                        type="number"
                        value={form.fees}
                        onChange={(event) =>
                            onChange('fees', Number(event.target.value))
                        }
                        fullWidth
                    />
                )}
                <TextField
                    label="Parent Name"
                    size="small"
                    value={form.parentName}
                    onChange={(event) =>
                        onChange('parentName', event.target.value)
                    }
                    fullWidth
                />
                <TextField
                    label="Contact Number"
                    size="small"
                    value={form.contactNumber}
                    onChange={(event) =>
                        onChange('contactNumber', event.target.value)
                    }
                    fullWidth
                />
                <TextField
                    label="Address"
                    size="small"
                    className="span-2"
                    multiline
                    minRows={2}
                    value={form.address}
                    onChange={(event) =>
                        onChange('address', event.target.value)
                    }
                    fullWidth
                />
                {/* Notes are kept per date on the student's page, not here — a
                    new student simply starts with an empty notes log. */}
            </Box>
        </DialogContent>
    </Dialog>
    )
}
