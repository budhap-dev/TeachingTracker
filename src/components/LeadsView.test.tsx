import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LeadsView } from './LeadsView'
import type { Lead } from '../data/students'

const lead = (overrides: Partial<Lead> = {}): Lead => ({
    id: 1,
    parentName: 'Priya Sharma',
    email: 'priya@example.com',
    year: '10',
    subjects: ['Mathematics', 'Physics'],
    goal: 'Confidence before GCSE mocks.',
    mode: 'Online',
    status: 'New',
    submittedOn: '2026-07-20',
    ...overrides,
})

const renderView = (
    leads: Lead[],
    props: Partial<Parameters<typeof LeadsView>[0]> = {}
) => {
    const onSetStatus = vi.fn()
    const onConvert = vi.fn()
    render(
        <LeadsView
            leads={leads}
            onSetStatus={onSetStatus}
            onConvert={onConvert}
            {...props}
        />
    )
    return { onSetStatus, onConvert }
}

describe('LeadsView', () => {
    it('shows everything a lead submitted, with contact links', () => {
        renderView([
            lead({ phone: '+44 7700 900456' }),
        ])

        expect(screen.getByText('Priya Sharma')).toBeInTheDocument()
        expect(
            screen.getByText(/year 10 · mathematics, physics · online/i)
        ).toBeInTheDocument()
        expect(
            screen.getByText('Confidence before GCSE mocks.')
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'priya@example.com' })
        ).toHaveAttribute('href', 'mailto:priya@example.com')
        expect(
            screen.getByRole('link', { name: '+44 7700 900456' })
        ).toHaveAttribute('href', 'tel:+447700900456')
        expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('marks a new lead as contacted, and back again', async () => {
        const user = userEvent.setup()
        const { onSetStatus } = renderView([
            lead({ id: 1, status: 'New' }),
            lead({ id: 2, parentName: 'Tom Riley', status: 'Contacted' }),
        ])

        await user.click(
            screen.getByRole('button', { name: /mark contacted/i })
        )
        expect(onSetStatus).toHaveBeenCalledWith(1, 'Contacted')

        await user.click(screen.getByRole('button', { name: /back to new/i }))
        expect(onSetStatus).toHaveBeenCalledWith(2, 'New')
    })

    it('offers convert on unconverted leads only', async () => {
        const user = userEvent.setup()
        const converted = lead({
            id: 3,
            parentName: 'Ana Costa',
            status: 'Converted',
        })
        const { onConvert } = renderView([lead({ id: 1 }), converted])

        const convertButtons = screen.getAllByRole('button', {
            name: /convert to student/i,
        })
        expect(convertButtons).toHaveLength(1)

        await user.click(convertButtons[0])
        expect(onConvert).toHaveBeenCalledWith(
            expect.objectContaining({ id: 1 })
        )
        // The converted card keeps its status pill but no actions.
        const card = screen.getByText('Ana Costa').closest('li')!
        expect(within(card).queryByRole('button')).not.toBeInTheDocument()
    })

    it('invites patience when the inbox is empty', () => {
        renderView([])
        expect(screen.getByText(/no enquiries yet/i)).toBeInTheDocument()
    })
})
