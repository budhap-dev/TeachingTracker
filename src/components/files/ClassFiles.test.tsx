import type { ReactNode } from 'react'
import {
    render as rtlRender,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Attachment } from '../../data/attachments'
import type { ScheduledSession, Student } from '../../data/students'

const auth = vi.hoisted(() => ({ enabled: true, connected: true }))
vi.mock('../../auth/msal', () => ({
    isOneDriveEnabled: () => auth.enabled,
    isOneDriveConnected: async () => auth.connected,
    connectOneDrive: vi.fn(),
}))
vi.mock('../../api/attachments', () => ({
    fetchAttachments: vi.fn(),
    deleteAttachment: vi.fn(),
}))
vi.mock('../../onedrive/attach', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../onedrive/attach')>()),
    attachFiles: vi.fn(),
    removeFileCopies: vi.fn(),
    removeClassFiles: vi.fn(),
}))
vi.mock('../../onedrive/graph', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../onedrive/graph')>()),
    thumbnailUrl: vi.fn().mockResolvedValue(null),
    downloadUrl: vi.fn(),
    previewUrl: vi.fn(),
}))

import { fetchAttachments } from '../../api/attachments'
import { connectOneDrive } from '../../auth/msal'
import {
    attachFiles,
    removeClassFiles,
    removeFileCopies,
} from '../../onedrive/attach'
import {
    downloadUrl,
    OneDriveNotConnectedError,
    previewUrl,
} from '../../onedrive/graph'
import { FileRefusedError } from '../../onedrive/prepareFile'
import { ClassSchedulingView } from '../ClassSchedulingView'
import { ClassFilesSection } from './ClassFilesSection'

const render = (ui: ReactNode) =>
    rtlRender(ui, {
        wrapper: ({ children }: { children: ReactNode }) => (
            <MemoryRouter>{children}</MemoryRouter>
        ),
    })

const today = new Date()
const day = new Date(today.getFullYear(), today.getMonth(), 14, 12)
const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`

const student = (id: number, firstName: string): Student =>
    ({
        id,
        studentId: `STU-${id}`,
        firstName,
        lastName: 'Perera',
        dob: '2011-05-14',
        subjects: ['Mathematics'],
        school: 'Kingston',
        year: '10',
        progress: 50,
        mode: 'Face to Face',
        fees: 120,
        notes: '',
        parentName: 'P',
        contactNumber: '1',
        address: 'A',
    }) as Student

const session = (
    id: number,
    studentId: number,
    extra: Partial<ScheduledSession> = {}
): ScheduledSession => ({
    id,
    studentId,
    studentName: 'x',
    year: '10',
    subject: 'Mathematics',
    date: dateKey,
    time: '09:00',
    durationMinutes: 60,
    notes: '',
    status: 'Scheduled',
    ...extra,
})

const file = (
    id: number,
    sessionId: number,
    extra: Partial<Attachment> = {}
): Attachment => ({
    id,
    sessionId,
    studentId: 1,
    studentName: 'Asha Perera',
    date: dateKey,
    subject: 'Mathematics',
    fileName: 'board.jpg',
    contentType: 'image/jpeg',
    kind: 'photo',
    sizeBytes: 820 * 1024,
    driveItemId: `D!${id}`,
    uploadedAt: '2026-11-12T10:00:00Z',
    ...extra,
})

const asha = student(1, 'Asha')
const maya = student(2, 'Maya')

beforeEach(() => {
    auth.enabled = true
    auth.connected = true
    vi.mocked(fetchAttachments).mockResolvedValue([])
})
afterEach(() => vi.clearAllMocks())

describe('ClassFilesSection', () => {
    it('shows nothing when the feature is off', () => {
        auth.enabled = false
        const { container } = render(
            <ClassFilesSection members={[session(10, 1)]} students={[asha]} />
        )
        expect(container).toBeEmptyDOMElement()
    })

    it('asks to connect OneDrive when it is not connected', async () => {
        auth.connected = false
        const user = userEvent.setup({ applyAccept: false })
        render(
            <ClassFilesSection members={[session(10, 1)]} students={[asha]} />
        )
        await user.click(
            await screen.findByRole('button', { name: /connect onedrive/i })
        )
        expect(connectOneDrive).toHaveBeenCalled()
        expect(fetchAttachments).not.toHaveBeenCalled()
    })

    it("lists only this class's files, a group's copies as one", async () => {
        vi.mocked(fetchAttachments).mockResolvedValue([
            file(1, 10, { groupId: 'g' }),
            file(2, 11, { studentId: 2, groupId: 'g' }),
            file(3, 99, { fileName: 'other class.pdf' }),
            file(4, 10, {
                fileName: 'paper.docx',
                kind: 'word',
                sizeBytes: 19000,
            }),
        ])
        render(
            <ClassFilesSection
                members={[
                    session(10, 1, { groupId: 'g' }),
                    session(11, 2, { groupId: 'g' }),
                ]}
                students={[asha, maya]}
            />
        )
        expect(
            await screen.findByText('Copy for each of 2 students')
        ).toBeInTheDocument()
        expect(fetchAttachments).toHaveBeenCalledWith({
            from: dateKey,
            to: dateKey,
        })
        // Header row + two files.
        expect(screen.getAllByRole('row')).toHaveLength(3)
        expect(screen.getByText('820 KB')).toBeInTheDocument()
        expect(screen.getByTitle('Word')).toBeInTheDocument()
        expect(screen.getByText('paper.docx')).toBeInTheDocument()
        expect(screen.queryByText('other class.pdf')).not.toBeInTheDocument()
    })

    it('says when the files cannot be loaded', async () => {
        vi.mocked(fetchAttachments).mockRejectedValue(new Error('down'))
        render(
            <ClassFilesSection members={[session(10, 1)]} students={[asha]} />
        )
        expect(await screen.findByRole('alert')).toHaveTextContent(
            /could not load/i
        )
    })

    it('uploads picked files for every attendee and reports refusals', async () => {
        const user = userEvent.setup({ applyAccept: false })
        vi.mocked(attachFiles).mockImplementation(
            async (_attendees, _files, onProgress) => {
                onProgress?.(1, 2)
                return [
                    { fileName: 'a.jpg', ok: true, attachments: [] },
                    {
                        fileName: 'notes.zip',
                        ok: false,
                        error: new FileRefusedError(
                            'notes.zip',
                            'Only photos…'
                        ),
                    },
                ]
            }
        )
        render(
            <ClassFilesSection
                members={[session(10, 1), session(11, 2), session(12, 404)]}
                students={[asha, maya]}
            />
        )
        await screen.findByText(/no files yet/i)
        const picked = [new File(['a'], 'a.jpg'), new File(['z'], 'notes.zip')]
        await user.upload(screen.getByTestId('class-files-input'), picked)

        await waitFor(() => expect(attachFiles).toHaveBeenCalled())
        // A row whose student is unknown gets no copy.
        expect(
            vi.mocked(attachFiles).mock.calls[0][0].map((a) => a.student.id)
        ).toEqual([1, 2])
        expect(await screen.findByRole('alert')).toHaveTextContent(
            'notes.zip: Only photos…'
        )
        expect(fetchAttachments).toHaveBeenCalledTimes(2)
    })

    it('ignores an empty pick', async () => {
        render(
            <ClassFilesSection members={[session(10, 1)]} students={[asha]} />
        )
        await screen.findByText(/no files yet/i)
        const input = screen.getByTestId('class-files-input')
        input.dispatchEvent(new Event('change', { bubbles: true }))
        expect(attachFiles).not.toHaveBeenCalled()
    })

    it('falls back to "Connect OneDrive" when an upload finds it disconnected', async () => {
        const user = userEvent.setup({ applyAccept: false })
        vi.mocked(attachFiles).mockRejectedValue(
            new OneDriveNotConnectedError()
        )
        render(
            <ClassFilesSection members={[session(10, 1)]} students={[asha]} />
        )
        await screen.findByText(/no files yet/i)
        await user.upload(
            screen.getByTestId('class-files-input'),
            new File(['a'], 'a.jpg')
        )
        expect(
            await screen.findByRole('button', { name: /connect onedrive/i })
        ).toBeInTheDocument()
    })

    it('reports any other upload failure', async () => {
        const user = userEvent.setup({ applyAccept: false })
        vi.mocked(attachFiles).mockRejectedValue(new Error('500'))
        render(
            <ClassFilesSection members={[session(10, 1)]} students={[asha]} />
        )
        await screen.findByText(/no files yet/i)
        await user.upload(
            screen.getByTestId('class-files-input'),
            new File(['a'], 'a.jpg')
        )
        expect(await screen.findByRole('alert')).toHaveTextContent(
            /could not upload/i
        )
    })

    it('removes every copy of a file, behind a confirm', async () => {
        const user = userEvent.setup({ applyAccept: false })
        vi.mocked(fetchAttachments).mockResolvedValue([
            file(1, 10, { groupId: 'g' }),
            file(2, 11, { groupId: 'g' }),
        ])
        render(
            <ClassFilesSection
                members={[session(10, 1), session(11, 2)]}
                students={[asha, maya]}
            />
        )
        await user.click(
            await screen.findByRole('button', { name: 'Remove board.jpg' })
        )
        const confirm = screen.getByRole('dialog', {
            name: /remove this file/i,
        })
        expect(confirm).toHaveTextContent(/all 2 students/)
        await user.click(within(confirm).getByRole('button', { name: 'Keep' }))
        expect(removeFileCopies).not.toHaveBeenCalled()

        await user.click(
            await screen.findByRole('button', { name: 'Remove board.jpg' })
        )
        await user.click(screen.getByRole('button', { name: 'Remove' }))
        await waitFor(() => expect(removeFileCopies).toHaveBeenCalledTimes(1))
        expect(
            vi.mocked(removeFileCopies).mock.calls[0][0].map((a) => a.id)
        ).toEqual([1, 2])
    })

    it('keeps the file and says so when removal fails', async () => {
        const user = userEvent.setup({ applyAccept: false })
        vi.mocked(fetchAttachments).mockResolvedValue([file(1, 10)])
        vi.mocked(removeFileCopies).mockRejectedValueOnce(new Error('down'))
        render(
            <ClassFilesSection members={[session(10, 1)]} students={[asha]} />
        )
        await user.click(
            await screen.findByRole('button', { name: 'Remove board.jpg' })
        )
        expect(screen.getByRole('dialog')).toHaveTextContent(
            /from your OneDrive/
        )
        await user.click(screen.getByRole('button', { name: 'Remove' }))
        expect(await screen.findByRole('alert')).toHaveTextContent(
            /could not remove board\.jpg/i
        )
    })

    it('asks to connect again when removal finds OneDrive disconnected', async () => {
        const user = userEvent.setup({ applyAccept: false })
        vi.mocked(fetchAttachments).mockResolvedValue([file(1, 10)])
        vi.mocked(removeFileCopies).mockRejectedValueOnce(
            new OneDriveNotConnectedError()
        )
        render(
            <ClassFilesSection members={[session(10, 1)]} students={[asha]} />
        )
        await user.click(
            await screen.findByRole('button', { name: 'Remove board.jpg' })
        )
        await user.click(screen.getByRole('button', { name: 'Remove' }))
        expect(
            await screen.findByRole('button', { name: /connect onedrive/i })
        ).toBeInTheDocument()
    })
})

describe('FileViewerDialog (through the class)', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'URL',
            Object.assign(URL, {
                createObjectURL: vi.fn(() => 'blob:local/1'),
                revokeObjectURL: vi.fn(),
            })
        )
    })
    afterEach(() => vi.unstubAllGlobals())

    const openFirst = async (attachment: Attachment) => {
        const user = userEvent.setup({ applyAccept: false })
        vi.mocked(fetchAttachments).mockResolvedValue([attachment])
        render(
            <ClassFilesSection members={[session(10, 1)]} students={[asha]} />
        )
        await user.click(await screen.findByText(attachment.fileName))
        return { user, dialog: await screen.findByRole('dialog') }
    }

    it('shows a photo from a local blob, with its caption', async () => {
        vi.mocked(downloadUrl).mockResolvedValue('https://dl/1')
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValue({
                    ok: true,
                    blob: async () => new Blob(['img']),
                })
        )
        const { dialog, user } = await openFirst(
            file(1, 10, { caption: 'Question 2' })
        )
        expect(within(dialog).getByLabelText('Caption')).toHaveValue(
            'Question 2'
        )
        expect(
            await within(dialog).findByRole('img', { name: 'board.jpg' })
        ).toHaveAttribute('src', 'blob:local/1')
        await user.click(within(dialog).getByRole('button', { name: 'Close' }))
        await waitFor(() =>
            expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local/1')
        )
    })

    it('shows a PDF in the browser viewer', async () => {
        vi.mocked(downloadUrl).mockResolvedValue('https://dl/2')
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValue({
                    ok: true,
                    blob: async () => new Blob(['%PDF']),
                })
        )
        const { dialog } = await openFirst(
            file(2, 10, {
                fileName: 'scan.pdf',
                kind: 'pdf',
                contentType: 'application/pdf',
            })
        )
        expect(await within(dialog).findByTitle('scan.pdf')).toHaveAttribute(
            'src',
            'blob:local/1'
        )
    })

    it("shows Word through OneDrive's preview", async () => {
        vi.mocked(previewUrl).mockResolvedValue(
            'https://my.microsoftpersonalcontent.com/p'
        )
        const { dialog } = await openFirst(
            file(3, 10, { fileName: 'paper.docx', kind: 'word' })
        )
        expect(await within(dialog).findByTitle('paper.docx')).toHaveAttribute(
            'src',
            'https://my.microsoftpersonalcontent.com/p'
        )
    })

    it('says so when a file cannot be opened, and still offers Download', async () => {
        vi.mocked(downloadUrl).mockResolvedValue('https://dl/9')
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({ ok: false, status: 410 })
        )
        const click = vi
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => {})
        const { dialog, user } = await openFirst(file(4, 10))
        expect(await within(dialog).findByRole('alert')).toHaveTextContent(
            /could not open/i
        )
        await user.click(
            within(dialog).getByRole('button', { name: 'Download' })
        )
        await waitFor(() => expect(click).toHaveBeenCalled())
    })

    it('downloads straight from the table', async () => {
        const user = userEvent.setup()
        vi.mocked(downloadUrl).mockResolvedValue('https://dl/7')
        const click = vi
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => {})
        vi.mocked(fetchAttachments).mockResolvedValue([
            file(7, 10, { fileName: 'deck.pptx', kind: 'powerpoint' }),
        ])
        render(
            <ClassFilesSection members={[session(10, 1)]} students={[asha]} />
        )
        await user.click(
            await screen.findByRole('button', { name: 'Download deck.pptx' })
        )
        await waitFor(() => expect(click).toHaveBeenCalled())
        expect(downloadUrl).toHaveBeenCalledWith('D!7')
    })

    it('opens the viewer from the Preview button', async () => {
        const user = userEvent.setup()
        vi.mocked(previewUrl).mockResolvedValue(
            'https://my.microsoftpersonalcontent.com/p'
        )
        vi.mocked(fetchAttachments).mockResolvedValue([
            file(8, 10, { fileName: 'paper.docx', kind: 'word' }),
        ])
        render(
            <ClassFilesSection members={[session(10, 1)]} students={[asha]} />
        )
        await user.click(
            await screen.findByRole('button', { name: 'Preview paper.docx' })
        )
        expect(await screen.findByTitle('paper.docx')).toBeInTheDocument()
    })
})

describe('deleting a class with files', () => {
    const renderPlanner = (onDeleteClass = vi.fn()) => {
        render(
            <ClassSchedulingView
                students={[asha]}
                sessions={[session(1, 1)]}
                onScheduleClass={vi.fn()}
                onEditClass={vi.fn()}
                onSetSessionStatus={vi.fn()}
                onAddMember={vi.fn()}
                onDeleteClass={onDeleteClass}
            />
        )
        return onDeleteClass
    }
    const openDelete = async (user: ReturnType<typeof userEvent.setup>) => {
        await user.click(
            screen.getByRole('button', { name: `Open ${day.toDateString()}` })
        )
        await user.click(
            await screen.findByRole('button', { name: /delete class/i })
        )
        expect(
            screen.getByText(/removes the class and its files/i)
        ).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: /^delete$/i }))
    }

    it('keeps files on their own tab, counted, with the form still there', async () => {
        const user = userEvent.setup()
        vi.mocked(fetchAttachments).mockResolvedValue([
            file(1, 1),
            file(2, 1, { fileName: 'b.pdf', kind: 'pdf' }),
        ])
        renderPlanner()
        await user.click(
            screen.getByRole('button', { name: `Open ${day.toDateString()}` })
        )
        const filesTab = await screen.findByRole('tab', { name: 'Files (2)' })
        expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute(
            'aria-selected',
            'true'
        )
        expect(
            screen.getByRole('button', { name: /delete class/i })
        ).toBeVisible()

        await user.click(filesTab)
        expect(
            screen.getByRole('button', { name: /attach files/i })
        ).toBeVisible()
        expect(
            screen.queryByRole('button', { name: /delete class/i })
        ).not.toBeInTheDocument()
        // The form is hidden, not gone: Save in the header still reaches it.
        expect(document.getElementById('scheduling-form')).not.toBeNull()

        await user.click(screen.getByRole('tab', { name: 'Details' }))
        expect(
            screen.getByRole('button', { name: /delete class/i })
        ).toBeVisible()
    })

    it('has no Files tab when the feature is off, or for a new class', async () => {
        auth.enabled = false
        const user = userEvent.setup()
        renderPlanner()
        await user.click(
            screen.getByRole('button', { name: `Open ${day.toDateString()}` })
        )
        await screen.findByRole('button', { name: /delete class/i })
        expect(
            screen.queryByRole('tab', { name: /files/i })
        ).not.toBeInTheDocument()
    })

    it('removes the files from OneDrive, then deletes the class', async () => {
        const user = userEvent.setup({ applyAccept: false })
        const onDeleteClass = renderPlanner()
        await openDelete(user)
        await waitFor(() => expect(onDeleteClass).toHaveBeenCalledWith(1))
        expect(
            vi.mocked(removeClassFiles).mock.calls[0][0].map((s) => s.id)
        ).toEqual([1])
    })

    it('keeps the class when OneDrive cannot remove its files', async () => {
        const user = userEvent.setup({ applyAccept: false })
        vi.mocked(removeClassFiles).mockRejectedValueOnce(new Error('down'))
        const onDeleteClass = renderPlanner()
        await openDelete(user)
        expect(
            await screen.findByText(/so the class was kept/i)
        ).toBeInTheDocument()
        expect(onDeleteClass).not.toHaveBeenCalled()
        await user.click(screen.getByRole('button', { name: /^keep$/i }))
    })

    it('asks to connect OneDrive first when it is not connected', async () => {
        const user = userEvent.setup({ applyAccept: false })
        vi.mocked(removeClassFiles).mockRejectedValueOnce(
            new OneDriveNotConnectedError()
        )
        const onDeleteClass = renderPlanner()
        await openDelete(user)
        expect(
            await screen.findByText(/connect onedrive .* before deleting/i)
        ).toBeInTheDocument()
        expect(onDeleteClass).not.toHaveBeenCalled()
    })
})
