import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StatementView } from './StatementView'
import type { PaymentRecord, Student } from '../data/students'

const student = (overrides: Partial<Student> = {}): Student =>
    ({
        id: 1,
        studentId: 'STU-100001',
        firstName: 'Asha',
        lastName: 'Perera',
        dob: '2011-05-14',
        subjects: ['Mathematics'],
        school: 'Kingston Grammar School',
        year: '10',
        progress: 88,
        mode: 'Face to Face',
        fees: 30,
        notes: 'Excellent problem solving skills.',
        parentName: 'Nadia Patel',
        contactNumber: '+44 7700 900123',
        address: '12 Oak Road, Kingston upon Thames, KT2 6LP',
        ...overrides,
    }) as Student

const record = (overrides: Partial<PaymentRecord> = {}): PaymentRecord =>
    ({
        id: 1,
        studentId: 1,
        studentName: 'Asha Perera',
        month: '2026-08',
        feePerSession: 30,
        sessionsHeld: 2,
        totalDurationMinutes: 120,
        amountDue: 60,
        amountPaid: 20,
        outstanding: 40,
        status: 'Partial',
        notes: '',
        sessions: [
            {
                date: '2026-08-04',
                subject: 'Mathematics',
                durationMinutes: 60,
                fee: 30,
            },
            {
                date: '2026-08-11',
                subject: 'Mathematics',
                durationMinutes: 60,
                fee: 30,
            },
        ],
        ...overrides,
    }) as PaymentRecord

const renderStatement = (props: Partial<PaymentRecord> = {}, who = student()) =>
    render(
        <StatementView
            student={who}
            record={record(props)}
            month="2026-08"
            siteName="AbhiTutor"
            onBack={vi.fn()}
        />
    )

describe('StatementView (REQ-055)', () => {
    it('names the student, the month and the business it comes from', () => {
        renderStatement()

        expect(
            screen.getByRole('heading', { name: 'Statement' })
        ).toBeInTheDocument()
        expect(screen.getByText('August 2026')).toBeInTheDocument()
        expect(screen.getByText('Asha Perera')).toBeInTheDocument()
        // The student code is an internal reference — it means nothing to the
        // family reading the statement, so it is not on it.
        expect(screen.queryByText('STU-100001')).not.toBeInTheDocument()
        // From the published document, never a name written into the code.
        expect(screen.getByText('AbhiTutor')).toBeInTheDocument()
    })

    it('itemises the classes that were actually held', () => {
        renderStatement()

        const table = screen.getByRole('table')
        const rows = within(table).getAllByRole('row')
        // A header and the two classes.
        expect(rows).toHaveLength(3)
        expect(rows[1]).toHaveTextContent('Tue 04 Aug')
        expect(rows[1]).toHaveTextContent('Mathematics')
        expect(rows[1]).toHaveTextContent('£30')
    })

    it('shows the totals the payment tracker shows — never recomputed', () => {
        renderStatement()

        expect(screen.getByText('£60')).toBeInTheDocument()
        expect(screen.getByText('£20')).toBeInTheDocument()
        expect(screen.getByText('£40')).toBeInTheDocument()
    })

    it('does not sum per-class fees for a monthly student', () => {
        // Their class lines carry fee 0 because the flat fee covers them, so
        // a naive per-line total would read £0 due.
        renderStatement({
            feeType: 'monthly',
            feePerSession: 200,
            amountDue: 200,
            amountPaid: 200,
            outstanding: 0,
            status: 'Paid',
            sessions: [
                {
                    date: '2026-08-04',
                    subject: 'Physics',
                    durationMinutes: 60,
                    fee: 0,
                },
            ],
        })

        expect(screen.getByText('Monthly fee')).toBeInTheDocument()
        expect(screen.getByText('£200 a month')).toBeInTheDocument()
        // The class is listed, but carries no fee of its own.
        const rows = within(screen.getByRole('table')).getAllByRole('row')
        expect(rows[1]).toHaveTextContent('Physics')
        expect(rows[1]).toHaveTextContent('—')
    })

    it('says plainly when a month had no classes', () => {
        renderStatement({ sessions: [], sessionsHeld: 0, totalDurationMinutes: 0 })

        expect(
            screen.getByText(/no classes were held in august 2026/i)
        ).toBeInTheDocument()
        expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('says a no-fee student is not billed, rather than showing £0 owed', () => {
        renderStatement({
            feeType: 'none',
            amountDue: 0,
            amountPaid: 0,
            outstanding: 0,
        })

        expect(
            screen.getByText(/no fee is charged for these lessons/i)
        ).toBeInTheDocument()
        expect(screen.queryByText('Outstanding')).not.toBeInTheDocument()
    })

    it('carries nothing a bill has no business carrying', () => {
        // It leaves the app as a file, so it holds who, what and how much —
        // never the address, the notes, or a progress figure (REQ-031).
        renderStatement()

        const page = document.body.textContent ?? ''
        expect(page).not.toContain('12 Oak Road')
        expect(page).not.toContain('Excellent problem solving')
        expect(page).not.toContain('88')
        expect(page).not.toContain('Nadia Patel')
    })
})
