import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { defaultSiteContent, emptyBio } from '../data/siteContent'
import type { SiteContent } from '../data/siteContent'
import { AboutView } from './AboutView'

const renderAbout = (overrides?: {
    content?: SiteContent
    canEdit?: boolean
    onPublish?: ReturnType<typeof vi.fn>
}) => {
    const onPublish = overrides?.onPublish ?? vi.fn()
    const utils = render(
        <MemoryRouter>
            <AboutView
                content={overrides?.content ?? defaultSiteContent}
                canEdit={overrides?.canEdit ?? false}
                publishing={false}
                onPublish={onPublish}
            />
        </MemoryRouter>
    )
    return { ...utils, onPublish }
}

describe('AboutView', () => {
    it('renders the CV-style page from the owner content (REQ-037)', () => {
        renderAbout()

        expect(
            screen.getByRole('heading', { name: /about me/i })
        ).toBeInTheDocument()
        // Intro Markdown renders as markup, not asterisks.
        expect(
            screen.getByText('Mrs Abhinanda Pandit').tagName
        ).toBe('STRONG')
        // Qualification pills, timelines, expectations, sections.
        expect(
            screen.getByText(/BSc \(Hons\) Physics, First Class — University/)
        ).toBeInTheDocument()
        expect(screen.getByText('Tutor across the UK')).toBeInTheDocument()
        expect(
            screen.getByText('B.Tech, Computer Science')
        ).toBeInTheDocument()
        expect(
            screen.getByText('Personalised one-to-one tuition')
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: /my teaching philosophy/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: /my promise/i })
        ).toBeInTheDocument()
        // Experience chip rides the hero's experienceYears.
        expect(screen.getByText('20+ years teaching')).toBeInTheDocument()
        // DBS badge only when the owner switched it on — defaults have not.
        expect(
            screen.queryByText(/enhanced dbs checked/i)
        ).not.toBeInTheDocument()
        // Both doors.
        expect(
            screen.getByRole('link', { name: /request a free assessment/i })
        ).toHaveAttribute('href', '/enquire')
        expect(
            screen.getByRole('link', { name: /contact us/i })
        ).toHaveAttribute('href', '/contact')
        // A visitor gets no editing chrome.
        expect(
            screen.queryByRole('button', { name: /publish about/i })
        ).not.toBeInTheDocument()
    })

    it('shows the DBS badge only when owner-set, with an honest empty state', () => {
        renderAbout({
            content: {
                ...defaultSiteContent,
                bio: { ...emptyBio, dbsChecked: true },
            },
        })
        expect(screen.getByText(/enhanced dbs checked/i)).toBeInTheDocument()
        expect(
            screen.getByText(/introduction is on its way/i)
        ).toBeInTheDocument()
    })

    it('offers the prepared content when empty, and publishes edits in place', async () => {
        const user = userEvent.setup()
        const { onPublish } = renderAbout({
            content: { ...defaultSiteContent, bio: { ...emptyBio } },
            canEdit: true,
        })

        // Empty: the load button fills the draft with the owner's copy.
        await user.click(
            screen.getByRole('button', { name: /load the prepared content/i })
        )
        expect(screen.getByLabelText(/page heading/i)).toHaveValue('About me')

        // Tweak the heading, add a titleless CV row (dropped at publish).
        fireEvent.change(screen.getByLabelText(/page heading/i), {
            target: { value: 'Meet your tutor' },
        })
        await user.click(
            screen.getAllByRole('button', { name: /add entry/i })[0]
        )

        await user.click(
            screen.getByRole('button', { name: /publish about/i })
        )
        const published = onPublish.mock.calls[0][0] as SiteContent
        expect(published.bio.heading).toBe('Meet your tutor')
        expect(published.bio.experience).toEqual(
            defaultSiteContent.bio.experience
        )
        // The rest of the document rides along untouched.
        expect(published.pricing).toEqual(defaultSiteContent.pricing)
        expect(published.faq).toEqual(defaultSiteContent.faq)
    })
})
