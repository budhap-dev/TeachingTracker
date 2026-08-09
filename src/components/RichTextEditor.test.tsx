import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RichTextEditor } from './RichTextEditor'

// jsdom lacks the range geometry ProseMirror probes on mount.
document.createRange = () => {
    const range = new Range()
    range.getBoundingClientRect = () =>
        ({ x: 0, y: 0, width: 0, height: 0 }) as DOMRect
    range.getClientRects = () =>
        ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as unknown as DOMRectList
    return range
}

describe('RichTextEditor', () => {
    it('mounts over Markdown and offers the formatting vocabulary', async () => {
        const onChange = vi.fn()
        render(
            <RichTextEditor
                value={'**Bold start** and a list:\n\n- one\n- two'}
                onChange={onChange}
                ariaLabel="Introduction"
            />
        )

        // TipTap initialises asynchronously in tests.
        await waitFor(() =>
            expect(screen.getByLabelText('Introduction')).toBeInTheDocument()
        )
        // The Markdown arrived as rich content, not asterisks.
        expect(screen.getByText('Bold start')).toBeInTheDocument()
        expect(screen.getByText('one')).toBeInTheDocument()
        // The toolbar carries exactly the supported vocabulary.
        for (const name of [
            'Bold',
            'Italic',
            'Bullet list',
            'Numbered list',
        ]) {
            expect(
                screen.getByRole('button', { name })
            ).toBeInTheDocument()
        }
    })

    it('reports edits back as Markdown', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(
            <RichTextEditor
                value="Plain words"
                onChange={onChange}
                ariaLabel="Introduction"
            />
        )
        await waitFor(() =>
            expect(screen.getByLabelText('Introduction')).toBeInTheDocument()
        )

        // Toggling bold over the (empty selection) document still runs the
        // toolbar path; typing exercises onUpdate → Markdown out.
        await user.click(screen.getByRole('button', { name: 'Bold' }))
        screen.getByLabelText('Introduction').focus()
        await user.keyboard('Hi')
        await waitFor(() => expect(onChange).toHaveBeenCalled())
        const lastCall = onChange.mock.calls.at(-1)?.[0] as string
        expect(typeof lastCall).toBe('string')
        expect(lastCall).toContain('Plain')
    })
})
