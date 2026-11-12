import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Button,
    Chip,
    InputAdornment,
    MenuItem,
    TextField,
} from '@mui/material'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import SearchIcon from '@mui/icons-material/Search'
import { fetchAttachments } from '../../api/attachments'
import { connectOneDrive } from '../../auth/msal'
import {
    type AttachmentKind,
    attachmentKindLabels,
    type AttachmentQuery,
} from '../../data/attachments'
import type { Student } from '../../data/students'
import { useOneDriveStatus } from '../../onedrive/useOneDrive'
import { type FileGroup, groupCopies } from '../../utils/classFiles'
import { FilesTable } from './FilesTable'
import { FileViewerDialog } from './FileViewerDialog'
import { useRemoveFile } from './useRemoveFile'

type Props = {
    /** Everyone who may have files — archived students included. */
    students: Student[]
    /** Subjects to filter by (from the classes). */
    subjects: string[]
    onBack: () => void
}

const ALL = 'all'
const KINDS = Object.keys(attachmentKindLabels) as AttachmentKind[]
/** Typing pauses this long before the search goes out. */
const SEARCH_DELAY_MS = 300

type Filters = {
    q: string
    type: AttachmentKind | typeof ALL
    studentId: string
    subject: string
    from: string
    to: string
}
const noFilters: Filters = {
    q: '',
    type: ALL,
    studentId: ALL,
    subject: ALL,
    from: '',
    to: '',
}

const toQuery = (
    filters: Omit<Filters, 'q'>,
    q: string
): AttachmentQuery => ({
    q: q.trim() || undefined,
    type: filters.type === ALL ? undefined : filters.type,
    studentId:
        filters.studentId === ALL ? undefined : Number(filters.studentId),
    subject: filters.subject === ALL ? undefined : filters.subject,
    from: filters.from || undefined,
    to: filters.to || undefined,
})

/**
 * Class files (REQ-063): every photo and document on the teacher's classes,
 * found by text, type, student, subject and dates — all combined — grouped
 * by day, newest first. Each opens in the viewer, and each leads back to its
 * class. Search is the API's (our own index), never OneDrive's.
 */
export const ClassFilesView = ({ students, subjects, onBack }: Props) => {
    const status = useOneDriveStatus()
    const [filters, setFilters] = useState<Filters>(noFilters)
    const [q, setQ] = useState('')
    const [groups, setGroups] = useState<FileGroup[] | null>(null)
    const [failed, setFailed] = useState(false)
    const [viewing, setViewing] = useState<number | null>(null)
    const [needsConnect, setNeedsConnect] = useState(false)

    // The search box waits for a pause in typing; every other filter is
    // a deliberate click and applies at once.
    useEffect(() => {
        const timer = setTimeout(() => setQ(filters.q), SEARCH_DELAY_MS)
        return () => clearTimeout(timer)
    }, [filters.q])

    // Built from the *settled* search text only: the raw box changes on
    // every keystroke, and must not send a request each time.
    const { type, studentId, subject, from, to } = filters
    const query = useMemo(
        () => toQuery({ type, studentId, subject, from, to }, q),
        [type, studentId, subject, from, to, q]
    )

    const load = useCallback(async () => {
        try {
            const rows = await fetchAttachments(query)
            // With one student chosen, their own copies are the files; with
            // everyone, a group class's copies fold into one.
            setGroups(groupCopies(rows))
            setFailed(false)
        } catch {
            setFailed(true)
        }
    }, [query])

    useEffect(() => {
        if (status === 'connected') void load()
    }, [status, load])

    const removal = useRemoveFile({
        onSettled: load,
        onNotConnected: () => setNeedsConnect(true),
    })

    // Newest class first, as the API sends them; the viewer steps through
    // them in the same order.
    const ordered = groups ?? []
    const studentOptions = useMemo(
        () =>
            [...students].sort((left, right) =>
                `${left.firstName} ${left.lastName}`.localeCompare(
                    `${right.firstName} ${right.lastName}`
                )
            ),
        [students]
    )

    const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
        setFilters((current) => ({ ...current, [key]: value }))
    const filtered =
        JSON.stringify(filters) !== JSON.stringify(noFilters)

    const header = (
        <div className="section-header">
            <div>
                <h3 className="page-heading">
                    <FolderOpenOutlinedIcon fontSize="small" />
                    Class files
                </h3>
                <p className="section-subtitle">
                    Every photo and document on your classes, newest class
                    first. Attach new ones from the class itself.
                </p>
            </div>
            <Button variant="text" onClick={onBack}>
                Back
            </Button>
        </div>
    )

    if (status === 'off' || status === 'checking') {
        return (
            <section className="content-stack">
                <div className="card">
                    {header}
                    {status === 'off' && (
                        <p className="section-subtitle">
                            Files on classes are not switched on here yet.
                        </p>
                    )}
                </div>
            </section>
        )
    }

    if (status === 'disconnected' || needsConnect) {
        return (
            <section className="content-stack">
                <div className="card">
                    {header}
                    <p className="section-subtitle">
                        Your files are kept in your own OneDrive. Connect it
                        to see them here.
                    </p>
                    <Button
                        variant="outlined"
                        onClick={() => void connectOneDrive()}
                    >
                        Connect OneDrive
                    </Button>
                </div>
            </section>
        )
    }

    const total = ordered.length

    return (
        <section className="content-stack">
            <div className="card">
                {header}

                <div className="class-files-filters">
                    <TextField
                        className="class-files-search"
                        size="small"
                        placeholder="Search file names and captions"
                        value={filters.q}
                        onChange={(event) => set('q', event.target.value)}
                        slotProps={{
                            htmlInput: { 'aria-label': 'Search files' },
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    <div
                        className="class-files-kinds"
                        role="group"
                        aria-label="File type"
                    >
                        {[ALL, ...KINDS].map((kind) => (
                            <Chip
                                key={kind}
                                label={
                                    kind === ALL
                                        ? 'All'
                                        : attachmentKindLabels[kind as AttachmentKind]
                                }
                                color={filters.type === kind ? 'primary' : 'default'}
                                variant={filters.type === kind ? 'filled' : 'outlined'}
                                aria-pressed={filters.type === kind}
                                onClick={() =>
                                    set('type', kind as Filters['type'])
                                }
                            />
                        ))}
                    </div>
                    <div className="class-files-pickers">
                        <TextField
                            select
                            size="small"
                            label="Student"
                            value={filters.studentId}
                            onChange={(event) =>
                                set('studentId', event.target.value)
                            }
                        >
                            <MenuItem value={ALL}>All students</MenuItem>
                            {studentOptions.map((student) => (
                                <MenuItem key={student.id} value={String(student.id)}>
                                    {student.firstName} {student.lastName}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            size="small"
                            label="Subject"
                            value={filters.subject}
                            onChange={(event) =>
                                set('subject', event.target.value)
                            }
                        >
                            <MenuItem value={ALL}>All subjects</MenuItem>
                            {subjects.map((subject) => (
                                <MenuItem key={subject} value={subject}>
                                    {subject}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            size="small"
                            type="date"
                            label="From"
                            value={filters.from}
                            onChange={(event) => set('from', event.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <TextField
                            size="small"
                            type="date"
                            label="To"
                            value={filters.to}
                            onChange={(event) => set('to', event.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        {filtered && (
                            <Button
                                size="small"
                                onClick={() => {
                                    setFilters(noFilters)
                                    setQ('')
                                }}
                            >
                                Clear
                            </Button>
                        )}
                        {groups && (
                            <span className="class-notes-count" role="status">
                                {total} {total === 1 ? 'file' : 'files'}
                            </span>
                        )}
                    </div>
                </div>

                {removal.error && (
                    <p className="class-files-refusal" role="alert">
                        {removal.error}
                    </p>
                )}

                {failed && (
                    <p className="class-files-refusal" role="alert">
                        Could not load your files. Try again in a moment.
                    </p>
                )}

                {groups && !failed && total === 0 && (
                    <p className="section-subtitle">
                        {filtered
                            ? 'No files match those filters.'
                            : 'No files yet. Open a class in the planner and use “Attach files”.'}
                    </p>
                )}

                {total > 0 && (
                    <FilesTable
                        groups={ordered}
                        onPreview={setViewing}
                        withClass
                        onRemove={removal.ask}
                        removingKey={removal.removingKey}
                    />
                )}
            </div>

            <FileViewerDialog
                groups={ordered}
                index={viewing}
                onIndexChange={setViewing}
                onCaptionSaved={() => void load()}
                showClassLink
            />
            {removal.dialog}
        </section>
    )
}
