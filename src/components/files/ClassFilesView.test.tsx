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
import type { Student } from '../../data/students'

const auth = vi.hoisted(() => ({ enabled: true, connected: true }))
vi.mock('../../auth/msal', () => ({
    isOneDriveEnabled: () => auth.enabled,
    isOneDriveConnected: async () => auth.connected,
    connectOneDrive: vi.fn(),
}))
vi.mock('../../api/attachments', () => ({
    fetchAttachments: vi.fn(),
    updateAttachmentCaption: vi.fn(),
}))
vi.mock('../../onedrive/attach', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../onedrive/attach')>()),
    removeFileCopies: vi.fn(),
}))
vi.mock('../../onedrive/graph', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../onedrive/graph')>()),
    thumbnailUrl: vi.fn().mockResolvedValue(null),
    downloadUrl: vi.fn().mockResolvedValue('https://dl/1'),
    previewUrl: vi.fn().mockResolvedValue('https://my.microsoftpersonalcontent.com/p'),
}))

import { fetchAttachments, updateAttachmentCaption } from '../../api/attachments'
import { connectOneDrive } from '../../auth/msal'
import { removeFileCopies } from '../../onedrive/attach'
import { OneDriveNotConnectedError } from '../../onedrive/graph'
import { ClassFilesView } from './ClassFilesView'

const render = (ui: ReactNode) =>
    rtlRender(ui, {
        wrapper: ({ children }: { children: ReactNode }) => (
            <MemoryRouter>{children}</MemoryRouter>
        ),
    })

const student = (id: number, firstName: string, lastName: string) =>
    ({ id, firstName, lastName, studentId: `STU-${id}` }) as Student
const students = [student(2, 'Maya', 'Fernando'), student(1, 'Asha', 'Perera')]

const file = (id: number, extra: Partial<Attachment> = {}): Attachment => ({
    id,
    sessionId: id * 10,
    studentId: 1,
    studentName: 'Asha Perera',
    date: '2026-11-12',
    subject: 'Mathematics',
    fileName: `file-${id}.pdf`,
    contentType: 'application/pdf',
    kind: 'pdf',
    sizeBytes: 2048,
    driveItemId: `D!${id}`,
    uploadedAt: '2026-11-12T10:00:00Z',
    ...extra,
})

const renderPage = (onBack = vi.fn()) => {
    render(
        <ClassFilesView
            students={students}
            subjects={['Mathematics', 'Physics']}
            onBack={onBack}
        />
    )
    return onBack
}

const lastQuery = () => vi.mocked(fetchAttachments).mock.calls.at(-1)?.[0]

beforeEach(() => {
    auth.enabled = true
    auth.connected = true
    vi.mocked(fetchAttachments).mockResolvedValue([])
    vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['x']) })
    )
    vi.stubGlobal(
        'URL',
        Object.assign(URL, {
            createObjectURL: vi.fn(() => 'blob:local/1'),
            revokeObjectURL: vi.fn(),
        })
    )
})
afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
})

describe('ClassFilesView — states', () => {
    it('says when the feature is off, and Back works', async () => {
        auth.enabled = false
        const user = userEvent.setup()
        const onBack = renderPage()
        expect(screen.getByText(/not switched on here yet/i)).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Back' }))
        expect(onBack).toHaveBeenCalled()
        expect(fetchAttachments).not.toHaveBeenCalled()
    })

    it('asks to connect OneDrive when it is not connected', async () => {
        auth.connected = false
        const user = userEvent.setup()
        renderPage()
        await user.click(await screen.findByRole('button', { name: /connect onedrive/i }))
        expect(connectOneDrive).toHaveBeenCalled()
    })

    it('points to the class when there are no files yet', async () => {
        renderPage()
        expect(await screen.findByText(/no files yet/i)).toBeInTheDocument()
        expect(screen.getByRole('status')).toHaveTextContent('0 files')
    })

    it('says so when the files cannot be loaded', async () => {
        vi.mocked(fetchAttachments).mockRejectedValue(new Error('down'))
        renderPage()
        expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i)
    })
})

describe('ClassFilesView — the gallery', () => {
    it('lists files in a table, newest class first, a group class once', async () => {
        vi.mocked(fetchAttachments).mockResolvedValue([
            file(1, { date: '2026-11-12', groupId: 'g', fileName: 'board.jpg', kind: 'photo', caption: 'Q2' }),
            file(2, { date: '2026-11-12', groupId: 'g', fileName: 'board.jpg', kind: 'photo', studentId: 2, studentName: 'Maya Fernando' }),
            file(3, { date: '2026-11-05', subject: 'Physics' }),
        ])
        const user = userEvent.setup()
        renderPage()
        expect(await screen.findByRole('status')).toHaveTextContent('2 files')
        const [, first, second] = screen.getAllByRole('row')
        expect(within(first).getByText('board.jpg')).toBeInTheDocument()
        expect(within(first).getByText('Q2')).toBeInTheDocument()
        expect(within(first).getByText('Asha Perera, Maya Fernando')).toBeInTheDocument()
        expect(within(first).getByTitle('Photo')).toBeInTheDocument()
        expect(within(first).getByRole('link', { name: '12 Nov 2026' })).toHaveAttribute(
            'href',
            '/scheduling?day=2026-11-12&entry=g'
        )
        expect(within(second).getByText('Physics')).toBeInTheDocument()
        expect(within(second).getByRole('link', { name: '5 Nov 2026' })).toHaveAttribute(
            'href',
            '/scheduling?day=2026-11-05&entry=solo-30'
        )

        await user.click(within(second).getByRole('button', { name: 'Preview file-3.pdf' }))
        expect(await within(await screen.findByRole('dialog')).findByText('2 / 2')).toBeInTheDocument()
    })

    it('combines every filter into one query, students sorted by name', async () => {
        const user = userEvent.setup()
        renderPage()
        await screen.findByText(/no files yet/i)

        await user.click(screen.getByRole('button', { name: 'Word' }))
        expect(screen.getByRole('button', { name: 'Word' })).toHaveAttribute('aria-pressed', 'true')

        await user.click(screen.getByRole('combobox', { name: 'Student' }))
        const options = within(screen.getByRole('listbox')).getAllByRole('option')
        expect(options.map((o) => o.textContent)).toEqual(['All students', 'Asha Perera', 'Maya Fernando'])
        await user.click(screen.getByRole('option', { name: 'Maya Fernando' }))

        await user.click(screen.getByRole('combobox', { name: 'Subject' }))
        await user.click(screen.getByRole('option', { name: 'Physics' }))

        await user.type(screen.getByLabelText('From'), '2026-11-01')
        await user.type(screen.getByLabelText('To'), '2026-11-30')

        await waitFor(() =>
            expect(lastQuery()).toEqual({
                q: undefined,
                type: 'word',
                studentId: 2,
                subject: 'Physics',
                from: '2026-11-01',
                to: '2026-11-30',
            })
        )
        expect(await screen.findByText(/no files match/i)).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Clear' }))
        await waitFor(() =>
            expect(lastQuery()).toEqual({
                q: undefined,
                type: undefined,
                studentId: undefined,
                subject: undefined,
                from: undefined,
                to: undefined,
            })
        )
        expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
    })

    it('searches names and captions once typing pauses', async () => {
        const user = userEvent.setup()
        renderPage()
        await screen.findByText(/no files yet/i)
        const calls = vi.mocked(fetchAttachments).mock.calls.length
        await user.type(screen.getByLabelText('Search files'), 'past paper')
        // Not one request per keystroke.
        await waitFor(() => expect(lastQuery()?.q).toBe('past paper'))
        expect(vi.mocked(fetchAttachments).mock.calls.length - calls).toBeLessThanOrEqual(2)
    })
})

describe('the viewer', () => {
    const three = [
        file(1, { date: '2026-11-12', fileName: 'one.pdf' }),
        file(2, { date: '2026-11-12', fileName: 'two.docx', kind: 'word' }),
        file(3, { date: '2026-11-01', fileName: 'three.pdf', caption: 'Mock exam' }),
    ]

    it('steps through files with the buttons and the arrow keys', async () => {
        vi.mocked(fetchAttachments).mockResolvedValue(three)
        const user = userEvent.setup()
        renderPage()
        await user.click(await screen.findByText('one.pdf'))
        const dialog = await screen.findByRole('dialog')
        expect(within(dialog).getByText('1 / 3')).toBeInTheDocument()
        expect(within(dialog).getByRole('button', { name: 'Previous file' })).toBeDisabled()

        await user.click(within(dialog).getByRole('button', { name: 'Next file' }))
        expect(await within(dialog).findByTitle('two.docx')).toHaveAttribute(
            'src',
            'https://my.microsoftpersonalcontent.com/p'
        )
        await user.keyboard('{ArrowRight}')
        expect(within(dialog).getByText('3 / 3')).toBeInTheDocument()
        expect(within(dialog).getByRole('button', { name: 'Next file' })).toBeDisabled()
        await user.keyboard('{ArrowRight}')
        expect(within(dialog).getByText('3 / 3')).toBeInTheDocument()
        await user.keyboard('{ArrowLeft}')
        expect(within(dialog).getByText('2 / 3')).toBeInTheDocument()

        // Typing in the caption never steps.
        await user.click(within(dialog).getByLabelText('Caption'))
        await user.keyboard('{ArrowLeft}')
        expect(within(dialog).getByText('2 / 3')).toBeInTheDocument()

        expect(within(dialog).getByRole('link', { name: /go to class/i })).toHaveAttribute(
            'href',
            '/scheduling?day=2026-11-12&entry=solo-20'
        )
        await user.click(within(dialog).getByRole('button', { name: 'Close' }))
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it("saves a caption to every student's copy, then reloads", async () => {
        vi.mocked(fetchAttachments).mockResolvedValue([
            file(1, { groupId: 'g', fileName: 'paper.pdf' }),
            file(2, { groupId: 'g', fileName: 'paper.pdf', studentId: 2 }),
        ])
        vi.mocked(updateAttachmentCaption).mockImplementation(async (id, caption) =>
            file(id, { caption })
        )
        const user = userEvent.setup()
        renderPage()
        await user.click(await screen.findByText('paper.pdf'))
        const dialog = await screen.findByRole('dialog')
        const save = within(dialog).getByRole('button', { name: 'Save caption' })
        expect(save).toBeDisabled()
        await user.type(within(dialog).getByLabelText('Caption'), '  Question 3  ')
        const loads = vi.mocked(fetchAttachments).mock.calls.length
        await user.click(save)
        await waitFor(() =>
            expect(vi.mocked(updateAttachmentCaption).mock.calls).toEqual([
                [1, 'Question 3'],
                [2, 'Question 3'],
            ])
        )
        await waitFor(() =>
            expect(vi.mocked(fetchAttachments).mock.calls.length).toBe(loads + 1)
        )
    })

    it('says so when a caption cannot be saved', async () => {
        vi.mocked(fetchAttachments).mockResolvedValue([file(3, { caption: 'Mock exam' })])
        vi.mocked(updateAttachmentCaption).mockRejectedValue(new Error('down'))
        const user = userEvent.setup()
        renderPage()
        await user.click(await screen.findByText('file-3.pdf'))
        const dialog = await screen.findByRole('dialog')
        const caption = within(dialog).getByLabelText('Caption')
        expect(caption).toHaveValue('Mock exam')
        await user.clear(caption)
        await user.click(within(dialog).getByRole('button', { name: 'Save caption' }))
        expect(await within(dialog).findByRole('alert')).toHaveTextContent(/could not save/i)
    })
})

describe('removing from Class files', () => {
    const rows = [
        file(1, { groupId: 'g', fileName: 'board.jpg', kind: 'photo' }),
        file(2, { groupId: 'g', fileName: 'board.jpg', kind: 'photo', studentId: 2 }),
        file(3, { fileName: 'scan.pdf' }),
    ]

    it("removes every student's copy behind a confirm, then reloads", async () => {
        vi.mocked(fetchAttachments).mockResolvedValue(rows)
        const user = userEvent.setup()
        renderPage()
        await user.click(await screen.findByRole('button', { name: 'Remove board.jpg' }))
        const confirm = screen.getByRole('dialog', { name: /remove this file/i })
        expect(confirm).toHaveTextContent(/all 2 students/)
        await user.click(within(confirm).getByRole('button', { name: 'Keep' }))
        expect(removeFileCopies).not.toHaveBeenCalled()

        const loads = vi.mocked(fetchAttachments).mock.calls.length
        await user.click(await screen.findByRole('button', { name: 'Remove scan.pdf' }))
        expect(screen.getByRole('dialog')).toHaveTextContent(/from your OneDrive/)
        await user.click(screen.getByRole('button', { name: 'Remove' }))
        await waitFor(() =>
            expect(vi.mocked(removeFileCopies).mock.calls[0][0].map((a) => a.id)).toEqual([3])
        )
        await waitFor(() =>
            expect(vi.mocked(fetchAttachments).mock.calls.length).toBe(loads + 1)
        )
    })

    it('keeps the file and says so when removal fails', async () => {
        vi.mocked(fetchAttachments).mockResolvedValue(rows)
        vi.mocked(removeFileCopies).mockRejectedValueOnce(new Error('down'))
        const user = userEvent.setup()
        renderPage()
        await user.click(await screen.findByRole('button', { name: 'Remove scan.pdf' }))
        await user.click(screen.getByRole('button', { name: 'Remove' }))
        expect(await screen.findByRole('alert')).toHaveTextContent('Could not remove scan.pdf')
    })

    it('asks to connect again when OneDrive has gone', async () => {
        vi.mocked(fetchAttachments).mockResolvedValue(rows)
        vi.mocked(removeFileCopies).mockRejectedValueOnce(new OneDriveNotConnectedError())
        const user = userEvent.setup()
        renderPage()
        await user.click(await screen.findByRole('button', { name: 'Remove scan.pdf' }))
        await user.click(screen.getByRole('button', { name: 'Remove' }))
        expect(await screen.findByRole('button', { name: /connect onedrive/i })).toBeInTheDocument()
    })
})
