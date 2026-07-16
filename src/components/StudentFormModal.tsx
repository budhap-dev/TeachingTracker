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
import type { FormEvent } from 'react'
import type { Student } from '../data/students'
import { subjectOptions, yearOptions } from '../utils/constants'

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

/** Uniform floating labels: every field, not just the pre-filled ones. */
const label = { inputLabel: { shrink: true } } as const

export const StudentFormModal = ({
    open,
    form,
    onClose,
    onChange,
    onSubmit,
}: StudentFormModalProps) => (
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
                onSubmit={onSubmit}
                className="student-form modal-form"
            >
                <TextField
                    label="First Name"
                    size="small"
                    value={form.firstName}
                    onChange={(event) =>
                        onChange('firstName', event.target.value)
                    }
                    slotProps={label}
                    fullWidth
                />
                <TextField
                    label="Last Name"
                    size="small"
                    value={form.lastName}
                    onChange={(event) =>
                        onChange('lastName', event.target.value)
                    }
                    slotProps={label}
                    fullWidth
                />
                <TextField
                    label="Date of Birth"
                    size="small"
                    type="date"
                    value={form.dob}
                    onChange={(event) => onChange('dob', event.target.value)}
                    slotProps={label}
                    fullWidth
                />
                <TextField
                    select
                    label="Year"
                    size="small"
                    value={form.year}
                    onChange={(event) => onChange('year', event.target.value)}
                    slotProps={label}
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
                        ...label,
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
                    slotProps={label}
                    fullWidth
                />
                <TextField
                    select
                    label="Mode"
                    size="small"
                    value={form.mode}
                    onChange={(event) => onChange('mode', event.target.value)}
                    slotProps={label}
                    fullWidth
                >
                    <MenuItem value="Online">Online</MenuItem>
                    <MenuItem value="Face to Face">Face to Face</MenuItem>
                    <MenuItem value="Both">Both</MenuItem>
                </TextField>
                <TextField
                    label="Progress %"
                    size="small"
                    type="number"
                    value={form.progress}
                    onChange={(event) =>
                        onChange('progress', Number(event.target.value))
                    }
                    slotProps={label}
                    fullWidth
                />
                <TextField
                    label="Fee per session (£)"
                    size="small"
                    type="number"
                    value={form.fees}
                    onChange={(event) =>
                        onChange('fees', Number(event.target.value))
                    }
                    slotProps={label}
                    fullWidth
                />
                <TextField
                    label="Parent Name"
                    size="small"
                    value={form.parentName}
                    onChange={(event) =>
                        onChange('parentName', event.target.value)
                    }
                    slotProps={label}
                    fullWidth
                />
                <TextField
                    label="Contact Number"
                    size="small"
                    value={form.contactNumber}
                    onChange={(event) =>
                        onChange('contactNumber', event.target.value)
                    }
                    slotProps={label}
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
                    slotProps={label}
                    fullWidth
                />
                <TextField
                    label="Notes"
                    size="small"
                    className="span-2"
                    multiline
                    minRows={2}
                    value={form.notes}
                    onChange={(event) => onChange('notes', event.target.value)}
                    slotProps={label}
                    fullWidth
                />
            </Box>
        </DialogContent>
    </Dialog>
)
