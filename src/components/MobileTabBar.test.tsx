import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { MobileTabBar } from './MobileTabBar'
import {
    fetchContactSucceeded,
    fetchSiteContentSucceeded,
    store,
} from '../store/store'
import { defaultSiteContent } from '../data/siteContent'

// The bar is for signed-out visitors under real auth config.
vi.mock('../auth/msal', () => ({ isAuthConfigured: () => true }))
vi.mock('@azure/msal-react', () => ({ useIsAuthenticated: () => false }))

const renderBar = (onMenu = vi.fn()) => {
    render(
        <Provider store={store}>
            <MemoryRouter initialEntries={['/']}>
                <MobileTabBar onMenu={onMenu} />
            </MemoryRouter>
        </Provider>
    )
    return onMenu
}

describe('MobileTabBar (REQ-049)', () => {
    it('renders Option C: flat, flat, raised spotlight, flat, Menu', () => {
        store.dispatch(fetchSiteContentSucceeded(defaultSiteContent))
        renderBar()

        const labels = screen
            .getAllByRole('link')
            .map((tab) => tab.textContent)
        expect(labels).toEqual(['Home', 'Offerings', 'Enquire', 'Pricing'])
        // The lift follows the ACTIVE tab (owner call) — Home here.
        expect(screen.getByRole('link', { name: /home/i })).toHaveClass(
            'raised'
        )
        expect(
            screen.getByRole('link', { name: /enquire/i })
        ).not.toHaveClass('raised')
        expect(
            screen.getByRole('button', { name: /menu/i })
        ).toBeInTheDocument()
    })

    it('is owner-configurable: slots, order and spotlight follow the document', () => {
        store.dispatch(
            fetchSiteContentSucceeded({
                ...defaultSiteContent,
                mobileNav: {
                    items: ['about', 'faq', 'reviews'],
                    spotlight: 'pricing',
                },
            })
        )
        renderBar()

        const labels = screen
            .getAllByRole('link')
            .map((tab) => tab.textContent)
        expect(labels).toEqual(['About', 'FAQ', 'Pricing', 'Reviews'])
        store.dispatch(fetchSiteContentSucceeded(defaultSiteContent))
    })

    it('lifts the Menu tab while the drawer is open', () => {
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/']}>
                    <MobileTabBar onMenu={vi.fn()} menuOpen />
                </MemoryRouter>
            </Provider>
        )
        expect(screen.getByRole('button', { name: /menu/i })).toHaveClass(
            'raised'
        )
        // The route tab yields the lift to the open menu.
        expect(
            screen.getByRole('link', { name: /home/i })
        ).not.toHaveClass('raised')
    })

    it('drops the Contact tab while no contact details are published', async () => {
        store.dispatch(fetchContactSucceeded({}))
        store.dispatch(
            fetchSiteContentSucceeded({
                ...defaultSiteContent,
                mobileNav: {
                    items: ['home', 'contact', 'pricing'],
                    spotlight: 'enquire',
                },
            })
        )
        renderBar()
        expect(
            screen.queryByRole('link', { name: /contact/i })
        ).not.toBeInTheDocument()
        store.dispatch(fetchSiteContentSucceeded(defaultSiteContent))
    })

    it('closes an open drawer a beat after tapping another tab', async () => {
        const user = userEvent.setup()
        const onMenuClose = vi.fn()
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/']}>
                    <MobileTabBar
                        onMenu={vi.fn()}
                        menuOpen
                        onMenuClose={onMenuClose}
                    />
                </MemoryRouter>
            </Provider>
        )
        await user.click(screen.getByRole('link', { name: /pricing/i }))
        // Not immediately — after the small delay.
        expect(onMenuClose).not.toHaveBeenCalled()
        await waitFor(() => expect(onMenuClose).toHaveBeenCalled(), {
            timeout: 1500,
        })
    })

    it('opens the drawer from the Menu tab', async () => {
        const user = userEvent.setup()
        const onMenu = renderBar()
        await user.click(screen.getByRole('button', { name: /menu/i }))
        expect(onMenu).toHaveBeenCalled()
    })
})
