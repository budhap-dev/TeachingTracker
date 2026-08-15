import { useState } from 'react'
import { Button, IconButton, TextField } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined'
import type { Reminder, ReminderInput } from '../data/students'

type ReminderFormProps = {
    initial?: Reminder
    onSave: (input: ReminderInput) => void
    onCancel: () => void
}

/**
 * The four fields, wherever a reminder is written (REQ-057) — adding at the
 * top of the list, or editing one in place. There is no second screen for a
 * date, a time and a line of text.
 */
export const ReminderForm = ({
    initial,
    onSave,
    onCancel,
}: ReminderFormProps) => {
    const [date, setDate] = useState(initial?.date ?? '')
    const [time, setTime] = useState(initial?.time ?? '')
    const [text, setText] = useState(initial?.text ?? '')
    const ready = date.trim() !== '' && text.trim() !== ''

    return (
        <form
            className="reminder-form"
            onSubmit={(event) => {
                event.preventDefault()
                if (ready) {
                    // An empty time is sent as no time, not as "00:00" —
                    // "Thursday" is a real reminder.
                    onSave({
                        date,
                        ...(time ? { time } : {}),
                        text: text.trim(),
                    })
                }
            }}
        >
            <TextField
                label="Date"
                type="date"
                size="small"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
                label="Time"
                type="time"
                size="small"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText="Optional"
            />
            <TextField
                label="Reminder"
                size="small"
                required
                value={text}
                onChange={(event) => setText(event.target.value)}
                slotProps={{ htmlInput: { maxLength: 500 } }}
                className="reminder-text-field"
            />
            <div className="reminder-form-actions">
                <Button type="submit" variant="contained" disabled={!ready}>
                    Save
                </Button>
                <Button type="button" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    )
}

type ReminderItemProps = {
    reminder: Reminder
    /** Past reminders fade rather than vanish — yesterday's is still today's. */
    past: boolean
    onSave: (input: ReminderInput) => void
    onDelete: () => void
}

/**
 * One reminder in the upcoming list (REQ-057).
 *
 * Deliberately not shaped like a class: a pinned note, no student link, no
 * "Booked" tag — a class is an obligation to a family, a reminder is one to
 * yourself, and the list must not blur them.
 */
export const ReminderItem = ({
    reminder,
    past,
    onSave,
    onDelete,
}: ReminderItemProps) => {
    const [editing, setEditing] = useState(false)

    if (editing) {
        return (
            <article className="reminder-item editing" role="listitem">
                <ReminderForm
                    initial={reminder}
                    onSave={(input) => {
                        onSave(input)
                        setEditing(false)
                    }}
                    onCancel={() => setEditing(false)}
                />
            </article>
        )
    }

    // "20 Aug · 12:00", or "20 Aug · any time" when it belongs to the day.
    const when = `${new Date(reminder.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
    })} · ${reminder.time ?? 'any time'}`

    return (
        <article
            className={`reminder-item ${past ? 'past' : ''}`}
            role="listitem"
        >
            <PushPinOutlinedIcon className="reminder-pin" fontSize="small" />
            <div className="reminder-body">
                <p className="reminder-text">{reminder.text}</p>
                <p className="reminder-when">{when}</p>
            </div>
            <div className="reminder-actions">
                <IconButton
                    size="small"
                    aria-label={`Edit reminder: ${reminder.text}`}
                    onClick={() => setEditing(true)}
                >
                    <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    aria-label={`Delete reminder: ${reminder.text}`}
                    onClick={onDelete}
                >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
            </div>
        </article>
    )
}
