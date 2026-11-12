import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Attachment } from '../data/attachments'
import type { Student } from '../data/students'

const flags = vi.hoisted(() => ({ files: true }))
vi.mock('../auth/msal', () => ({
    isOneDriveEnabled: () => flags.files,
    connectOneDrive: vi.fn(),
}))
vi.mock('../api/attachments', () => ({ fetchAttachments: vi.fn() }))
vi.mock('../api/students', () => ({ deleteStudent: vi.fn() }))
vi.mock('../onedrive/attach', () => ({ eraseStudentFiles: vi.fn() }))

import { fetchAttachments } from '../api/attachments'
import { deleteStudent } from '../api/students'
import { connectOneDrive } from '../auth/msal'
import { eraseStudentFiles } from '../onedrive/attach'
import { OneDriveNotConnectedError } from '../onedrive/graph'
import { EraseStudentDialog } from './EraseStudentDialog'

const asha = {
    id: 3,
    firstName: 'Asha',
    lastName: 'Perera',
    studentId: 'STU-3',
    isArchived: true,
} as Student
const rows = [{ id: 1 }, { id: 2 }] as Attachment[]

const renderDialog = (onErased = vi.fn(), onClose = vi.fn()) => {
    render(
        <EraseStudentDialog
            student={asha}
            open
            onClose={onClose}
            onErased={onErased}
        />
    )
    return { onErased, onClose }
}

const confirmAndErase = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/type their name/i), '  asha PERERA ')
    await user.click(screen.getByRole('button', { name: /erase permanently/i }))
}

beforeEach(() => {
    flags.files = true
    vi.mocked(fetchAttachments).mockResolvedValue(rows)
})
afterEach(() => vi.resetAllMocks())

describe('EraseStudentDialog', () => {
    it('says what goes, and waits for the name to be typed', async () => {
        const user = userEvent.setup()
        renderDialog()
        expect(
            await screen.findByText(/record, classes and payment history, and 2 files in your onedrive/i)
        ).toBeInTheDocument()
        const erase = screen.getByRole('button', { name: /erase permanently/i })
        expect(erase).toBeDisabled()
        await user.type(screen.getByLabelText(/type their name/i), 'Asha')
        expect(erase).toBeDisabled()
    })

    it('erases the files by id and folder first, then the record', async () => {
        const order: string[] = []
        vi.mocked(eraseStudentFiles).mockImplementation(async () => {
            order.push('files')
        })
        vi.mocked(deleteStudent).mockImplementation(async () => {
            order.push('record')
        })
        const user = userEvent.setup()
        const { onErased } = renderDialog()
        await confirmAndErase(user)
        await waitFor(() => expect(onErased).toHaveBeenCalledWith(3))
        expect(order).toEqual(['files', 'record'])
        expect(eraseStudentFiles).toHaveBeenCalledWith(asha, rows)
        expect(fetchAttachments).toHaveBeenCalledWith({ studentId: 3 })
    })

    it('erases nothing when OneDrive cannot remove the files, and offers a retry', async () => {
        vi.mocked(eraseStudentFiles).mockRejectedValueOnce(new Error('down'))
        const user = userEvent.setup()
        const { onErased } = renderDialog()
        await confirmAndErase(user)
        expect(await screen.findByRole('alert')).toHaveTextContent(/nothing was erased/i)
        expect(deleteStudent).not.toHaveBeenCalled()
        expect(onErased).not.toHaveBeenCalled()

        await user.click(screen.getByRole('button', { name: 'Try again' }))
        await waitFor(() => expect(onErased).toHaveBeenCalledWith(3))
    })

    it('asks to connect OneDrive when it is not connected', async () => {
        vi.mocked(eraseStudentFiles).mockRejectedValueOnce(new OneDriveNotConnectedError())
        const user = userEvent.setup()
        renderDialog()
        await confirmAndErase(user)
        expect(await screen.findByRole('alert')).toHaveTextContent(/nothing has been erased yet/i)
        await user.click(screen.getByRole('button', { name: /connect onedrive/i }))
        expect(connectOneDrive).toHaveBeenCalled()
        expect(deleteStudent).not.toHaveBeenCalled()
    })

    it('says so when the files went but the record did not', async () => {
        vi.mocked(deleteStudent).mockRejectedValueOnce(new Error('500'))
        const user = userEvent.setup()
        const { onErased } = renderDialog()
        await confirmAndErase(user)
        expect(await screen.findByRole('alert')).toHaveTextContent(/files are gone from onedrive, but the record/i)
        expect(onErased).not.toHaveBeenCalled()
    })

    it('without files switched on, erases the record alone', async () => {
        flags.files = false
        const user = userEvent.setup()
        const { onErased } = renderDialog()
        expect(screen.getByText(/removes their record, classes and payment history\. it/i)).toBeInTheDocument()
        await confirmAndErase(user)
        await waitFor(() => expect(onErased).toHaveBeenCalledWith(3))
        expect(eraseStudentFiles).not.toHaveBeenCalled()
        expect(fetchAttachments).not.toHaveBeenCalled()
    })

    it('words a single file as one', async () => {
        vi.mocked(fetchAttachments).mockResolvedValueOnce([rows[0]])
        renderDialog()
        expect(await screen.findByText(/1 file in your onedrive/i)).toBeInTheDocument()
    })

    it('falls back to "their files" when the count cannot load', async () => {
        vi.mocked(fetchAttachments).mockRejectedValueOnce(new Error('down'))
        renderDialog()
        expect(await screen.findByText(/their files in your onedrive/i)).toBeInTheDocument()
    })

    it('closes on Keep', async () => {
        const user = userEvent.setup()
        const { onClose } = renderDialog()
        await user.click(screen.getByRole('button', { name: 'Keep' }))
        expect(onClose).toHaveBeenCalled()
    })
})
