import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SubjectChips } from './SubjectChips'
import { subjectEmoji } from '../utils/subjectEmoji'

const subjects = ['Mathematics', 'Physics', 'Chemistry']

/** jsdom has no matchMedia; every test says which visitor it is testing. */
const visitorWants = (motion: 'full' | 'reduced') =>
    vi.stubGlobal(
        'matchMedia',
        vi.fn().mockReturnValue({ matches: motion === 'reduced' })
    )

const sparks = () => document.querySelectorAll('.chip-spark')

beforeEach(() => visitorWants('full'))

describe('SubjectChips (REQ-051)', () => {
    it('shows a chip per published subject, and nothing when there are none', () => {
        const { rerender } = render(<SubjectChips subjects={subjects} />)

        expect(screen.getAllByRole('button')).toHaveLength(3)

        rerender(<SubjectChips subjects={[]} />)

        expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('throws that subject’s own emoji, not generic confetti', async () => {
        render(<SubjectChips subjects={subjects} />)

        await userEvent.click(screen.getByRole('button', { name: /chemistry/i }))

        const thrown = [...sparks()].map((spark) => spark.textContent)
        // Chemistry's set from the Offerings flip cards, all of it.
        expect(thrown.sort()).toEqual([...subjectEmoji('Chemistry')].sort())
    })

    // A burst of nine drawn from a set of five repeated four of them, and it
    // read as the same picture twice rather than a handful of different ones
    // (owner report, 2026-08-16).
    it('shows each emoji once — never the same one twice', async () => {
        render(<SubjectChips subjects={subjects} />)

        await userEvent.click(screen.getByRole('button', { name: /physics/i }))

        const thrown = [...sparks()].map((spark) => spark.textContent)
        expect(new Set(thrown).size).toBe(thrown.length)
    })

    it('throws from the chip that was tapped, and only that one', async () => {
        render(<SubjectChips subjects={subjects} />)

        await userEvent.click(screen.getByRole('button', { name: /physics/i }))

        const physics = screen.getByRole('button', { name: /physics/i })
        expect(physics.querySelectorAll('.chip-spark')).toHaveLength(
            subjectEmoji('Physics').length
        )
        expect(
            screen
                .getByRole('button', { name: /mathematics/i })
                .querySelectorAll('.chip-spark')
        ).toHaveLength(0)
    })

    it('plays for a keyboard, not only a pointer', async () => {
        render(<SubjectChips subjects={subjects} />)

        await userEvent.tab()
        await userEvent.keyboard('{Enter}')

        expect(sparks().length).toBeGreaterThan(0)
    })

    it('clears each spark when its flight ends, leaving nothing behind', () => {
        vi.useFakeTimers()
        render(<SubjectChips subjects={subjects} />)

        fireEvent.click(screen.getByRole('button', { name: /physics/i }))
        expect(sparks()).toHaveLength(subjectEmoji('Physics').length)

        act(() => vi.advanceTimersByTime(1500))

        expect(sparks()).toHaveLength(0)
        vi.useRealTimers()
    })

    // A burst mid-flight when the visitor leaves the page must not fire state
    // updates into a component that is gone.
    it('drops its timers when it unmounts mid-flight', () => {
        vi.useFakeTimers()
        const { unmount } = render(<SubjectChips subjects={subjects} />)
        fireEvent.click(screen.getByRole('button', { name: /physics/i }))

        unmount()
        act(() => vi.advanceTimersByTime(1500))

        expect(sparks()).toHaveLength(0)
        vi.useRealTimers()
    })

    it('says nothing to a screen reader beyond the subject name', async () => {
        render(<SubjectChips subjects={subjects} />)

        await userEvent.click(screen.getByRole('button', { name: /physics/i }))

        sparks().forEach((spark) =>
            expect(spark).toHaveAttribute('aria-hidden')
        )
        // The name is still just the subject — no emoji read out after it.
        expect(
            screen.getByRole('button', { name: 'Physics' })
        ).toBeInTheDocument()
    })

    it('never navigates — the chips are not doors (owner call, 2026-08-11)', () => {
        render(<SubjectChips subjects={subjects} />)

        expect(screen.queryByRole('link')).not.toBeInTheDocument()
        screen
            .getAllByRole('button')
            .forEach((chip) => expect(chip).toHaveAttribute('type', 'button'))
    })
})

describe('a visitor who asked for less motion', () => {
    beforeEach(() => visitorWants('reduced'))

    it('gets a glow instead of a burst', async () => {
        render(<SubjectChips subjects={subjects} />)

        await userEvent.click(screen.getByRole('button', { name: /physics/i }))

        expect(sparks()).toHaveLength(0)
        expect(screen.getByRole('button', { name: /physics/i })).toHaveClass(
            'is-lit'
        )
    })

    it('lets the glow finish and clears it', () => {
        vi.useFakeTimers()
        render(<SubjectChips subjects={subjects} />)
        const physics = screen.getByRole('button', { name: /physics/i })

        fireEvent.click(physics)
        expect(physics).toHaveClass('is-lit')

        act(() => vi.advanceTimersByTime(600))

        expect(physics).not.toHaveClass('is-lit')
        vi.useRealTimers()
    })

    it('does not stack a chip that is already glowing', () => {
        vi.useFakeTimers()
        render(<SubjectChips subjects={subjects} />)
        const physics = screen.getByRole('button', { name: /physics/i })

        fireEvent.click(physics)
        fireEvent.click(physics)
        act(() => vi.advanceTimersByTime(600))

        expect(physics).not.toHaveClass('is-lit')
        vi.useRealTimers()
    })

    // Without matchMedia at all, the quiet variant is the fallback — the
    // burst is the thing that has to be asked for, not the default.
    it('is what a browser without matchMedia gets', async () => {
        vi.stubGlobal('matchMedia', undefined)
        render(<SubjectChips subjects={subjects} />)

        await userEvent.click(screen.getByRole('button', { name: /physics/i }))

        expect(sparks()).toHaveLength(0)
    })
})
