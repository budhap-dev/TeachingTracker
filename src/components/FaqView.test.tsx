import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { defaultSiteContent } from '../data/siteContent'
import type { SiteContent } from '../data/siteContent'
import { FaqView } from './FaqView'

const renderFaq = (overrides?: {
    content?: SiteContent
    canEdit?: boolean
    onPublish?: ReturnType<typeof vi.fn>
}) => {
    const onPublish = overrides?.onPublish ?? vi.fn()
    const utils = render(
        <MemoryRouter>
            <FaqView
                content={overrides?.content ?? defaultSiteContent}
                canEdit={overrides?.canEdit ?? false}
                publishing={false}
                onPublish={onPublish}
            />
        </MemoryRouter>
    )
    return { ...utils, onPublish }
}

describe('FaqView', () => {
    it('renders the accordion for visitors, closing on the enquiry CTA', () => {
        renderFaq()

        expect(
            screen.getByRole('heading', { name: /questions families ask/i })
        ).toBeInTheDocument()
        expect(
            screen.getByText(defaultSiteContent.faq[0].question)
        ).toBeInTheDocument()
        expect(
            screen.getByText(defaultSiteContent.faq[0].answer)
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: /ask me — request a free/i })
        ).toHaveAttribute('href', '/enquire')
        // A visitor gets no editing chrome.
        expect(
            screen.queryByRole('button', { name: /publish faq/i })
        ).not.toBeInTheDocument()
        expect(screen.queryByText(/edit the faq/i)).not.toBeInTheDocument()
    })

    it('says so when nothing is published yet', () => {
        renderFaq({
            content: { ...defaultSiteContent, faq: [] },
        })
        expect(
            screen.getByText(/no questions published yet/i)
        ).toBeInTheDocument()
    })

    it('lets the teacher edit in place and publishes only complete rows', async () => {
        const user = userEvent.setup()
        const { onPublish } = renderFaq({ canEdit: true })

        // Publish is disarmed until something actually changes.
        const publish = screen.getByRole('button', { name: /publish faq/i })
        expect(publish).toBeDisabled()

        const questions = screen.getAllByLabelText(/^question$/i)
        fireEvent.change(questions[0], {
            target: { value: 'Which years do you teach?' },
        })

        // A half-filled row is dropped at publish, never a blocker.
        await user.click(
            screen.getByRole('button', { name: /add question/i })
        )
        const grown = screen.getAllByLabelText(/^question$/i)
        fireEvent.change(grown[grown.length - 1], {
            target: { value: 'Half-finished?' },
        })

        expect(publish).toBeEnabled()
        await user.click(publish)

        const published = onPublish.mock.calls[0][0] as SiteContent
        expect(published.faq[0].question).toBe('Which years do you teach?')
        expect(published.faq).toHaveLength(defaultSiteContent.faq.length)
        // Everything else in the document rides along untouched.
        expect(published.siteName).toBe(defaultSiteContent.siteName)
        expect(published.subjects).toEqual(defaultSiteContent.subjects)
    })

    it('offers the starter set when the FAQ is empty, and removes rows', async () => {
        const user = userEvent.setup()
        const { onPublish } = renderFaq({
            content: { ...defaultSiteContent, faq: [] },
            canEdit: true,
        })

        await user.click(
            screen.getByRole('button', { name: /add the starter questions/i })
        )
        expect(
            screen.getByDisplayValue(defaultSiteContent.faq[0].question)
        ).toBeInTheDocument()

        // Remove one row, publish the rest.
        await user.click(
            screen.getAllByRole('button', { name: /^remove/i })[0]
        )
        await user.click(
            screen.getByRole('button', { name: /publish faq/i })
        )

        const published = onPublish.mock.calls[0][0] as SiteContent
        expect(published.faq).toHaveLength(
            defaultSiteContent.faq.length - 1
        )
        expect(published.faq[0].question).toBe(
            defaultSiteContent.faq[1].question
        )
    })
})
