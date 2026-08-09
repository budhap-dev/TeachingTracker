import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { defaultSiteContent } from '../data/siteContent'
import type { SiteContent } from '../data/siteContent'
import { PricingView } from './PricingView'

const renderPricing = (overrides?: {
    content?: SiteContent
    canEdit?: boolean
    onPublish?: ReturnType<typeof vi.fn>
    contactPublished?: boolean
}) => {
    const onPublish = overrides?.onPublish ?? vi.fn()
    const utils = render(
        <MemoryRouter>
            <PricingView
                content={overrides?.content ?? defaultSiteContent}
                canEdit={overrides?.canEdit ?? false}
                publishing={false}
                contactPublished={overrides?.contactPublished ?? true}
                onPublish={onPublish}
            />
        </MemoryRouter>
    )
    return { ...utils, onPublish }
}

describe('PricingView', () => {
    it('drops the Contact-me door when contact is unpublished', () => {
        renderPricing({ contactPublished: false })
        expect(
            screen.queryByRole('link', { name: /contact me/i })
        ).not.toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: /free assessment/i })
        ).toBeInTheDocument()
    })

    it('shows the per-level from-rates, factors and the honest close (REQ-022)', () => {
        renderPricing()

        const rates = screen.getByRole('list', { name: /rates by level/i })
        // The owner's anchors: GCSE from £20/hr, A-level from £30/hr.
        expect(rates).toHaveTextContent('GCSE')
        expect(rates).toHaveTextContent('from £20')
        expect(rates).toHaveTextContent('A-level')
        expect(rates).toHaveTextContent('from £30')
        expect(rates).toHaveTextContent('/session · per student')

        expect(
            screen.getByText('One-to-one or small group')
        ).toBeInTheDocument()
        expect(
            screen.getByText(/agreed at the free assessment/i)
        ).toBeInTheDocument()
        // The chat line and both doors: assessment and plain contact.
        expect(
            screen.getByText(/generally start from £20\/session — let's have a chat/i)
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', {
                name: /get your exact rate — free assessment/i,
            })
        ).toHaveAttribute('href', '/enquire')
        expect(
            screen.getByRole('link', { name: /contact me/i })
        ).toHaveAttribute('href', '/contact')
        // A visitor gets no editing chrome.
        expect(
            screen.queryByRole('button', { name: /publish pricing/i })
        ).not.toBeInTheDocument()
    })

    it('degrades honestly when no rates are published', () => {
        renderPricing({
            content: {
                ...defaultSiteContent,
                pricing: { rates: [], factors: [], note: '' },
            },
        })
        expect(
            screen.getByText(/rates are agreed individually/i)
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('list', { name: /rates by level/i })
        ).not.toBeInTheDocument()
    })

    it('lets the teacher edit rates in place and publishes only whole rows', async () => {
        const user = userEvent.setup()
        const { onPublish } = renderPricing({ canEdit: true })

        const publish = screen.getByRole('button', {
            name: /publish pricing/i,
        })
        expect(publish).toBeDisabled()

        // Raise the GCSE anchor…
        fireEvent.change(screen.getAllByLabelText(/from £\/session/i)[0], {
            target: { value: '22' },
        })
        // …and add a half row that must be dropped, not a blocker.
        await user.click(screen.getByRole('button', { name: /add rate/i }))
        const labels = screen.getAllByLabelText(/^level$/i)
        fireEvent.change(labels[labels.length - 1], {
            target: { value: 'KS3' },
        })

        expect(publish).toBeEnabled()
        await user.click(publish)

        const published = onPublish.mock.calls[0][0] as SiteContent
        expect(published.pricing.rates).toEqual([
            { label: 'GCSE', fromPerHour: 22 },
            { label: 'A-level', fromPerHour: 30 },
        ])
        // The rest of the document rides along untouched.
        expect(published.faq).toEqual(defaultSiteContent.faq)
        expect(published.siteName).toBe(defaultSiteContent.siteName)
    })
})
