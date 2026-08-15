import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Provider } from 'react-redux'
import { describe, expect, it } from 'vitest'
import { store } from '../store/store'
import { StatementRoute } from './statement'

/** Renders the route at a given student/month, as the router would. */
const renderAt = (path: string) =>
    render(
        <Provider store={store}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route
                        path="/payments/statement/:studentId/:month"
                        element={<StatementRoute />}
                    />
                </Routes>
            </MemoryRouter>
        </Provider>
    )

describe('StatementRoute (REQ-055)', () => {
    it('renders the statement for the student and month asked for', async () => {
        // The shared test store is seeded from the fixture API.
        renderAt('/payments/statement/1/2026-01')

        expect(
            await screen.findByRole('heading', { name: 'Statement' })
        ).toBeInTheDocument()
        expect(screen.getByText('January 2026')).toBeInTheDocument()
    })

    it('says so plainly when there is no record to print', async () => {
        // A month nobody was billed for is nothing to print — better than an
        // invented empty document with someone's name on it.
        renderAt('/payments/statement/1/1999-01')

        await waitFor(() =>
            expect(
                screen.getByText(/no billing record for that student and month/i)
            ).toBeInTheDocument()
        )
    })
})
