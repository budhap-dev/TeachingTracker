import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { defaultSiteContent } from '../data/siteContent'
import type { SiteContent } from '../data/siteContent'
import { SiteEditorView } from './SiteEditorView'

const renderEditor = (overrides?: {
    content?: SiteContent
    publishing?: boolean
    onPublish?: ReturnType<typeof vi.fn>
}) => {
    const onPublish = overrides?.onPublish ?? vi.fn()
    const utils = render(
        <MemoryRouter>
        <SiteEditorView
            content={overrides?.content ?? defaultSiteContent}
            publishing={overrides?.publishing ?? false}
            onPublish={onPublish}
        />
        </MemoryRouter>
    )
    return { ...utils, onPublish }
}

const publishButton = () => screen.getByRole('button', { name: /^publish$/i })

describe('SiteEditorView', () => {
    it('prefills every section from the published document', () => {
        renderEditor()

        expect(screen.getByLabelText(/site name/i)).toHaveValue(
            'AbhiTutor'
        )
        expect(screen.getByLabelText(/^headline/i)).toHaveValue(
            defaultSiteContent.hero.headline
        )
        // The first subject row, with its spec lists joined back to text.
        expect(screen.getAllByLabelText(/^subject$/i)[0]).toHaveValue(
            'Mathematics'
        )
        expect(screen.getAllByLabelText(/levels/i)[0]).toHaveValue(
            'KS3, GCSE, A-level'
        )
        expect(screen.getAllByLabelText(/exam boards/i)[0]).toHaveValue(
            'AQA, Edexcel, OCR'
        )
        // Journey and approach rows arrive as title/detail pairs.
        expect(screen.getByDisplayValue('Enquire')).toBeInTheDocument()
        expect(
            screen.getByDisplayValue('Grouped by year and subject')
        ).toBeInTheDocument()

        // Every reorderable row carries a focusable grip — sections included.
        expect(
            screen.getByRole('button', { name: /reorder subjects taught/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: /reorder mathematics/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: /reorder enquire/i })
        ).toBeInTheDocument()
    })

    it('arms Publish only once something differs, and publishes the edit', async () => {
        const user = userEvent.setup()
        const { onPublish } = renderEditor()

        // Nothing changed yet: nothing to publish, no changes to discard.
        expect(publishButton()).toBeDisabled()
        expect(
            screen.queryByRole('button', { name: /discard changes/i })
        ).not.toBeInTheDocument()

        // Long text lands as one change event — per-keystroke typing here
        // re-renders the whole editor per key and pushes CI past the test
        // timeout. Two short-string tests below keep the typing path covered.
        fireEvent.change(screen.getByLabelText(/^headline/i), {
            target: { value: 'Tutoring that clicks.' },
        })

        expect(publishButton()).toBeEnabled()
        await user.click(publishButton())

        expect(onPublish).toHaveBeenCalledWith({
            ...defaultSiteContent,
            hero: {
                ...defaultSiteContent.hero,
                headline: 'Tutoring that clicks.',
            },
        })
    })

    it('splits the comma-separated spec lists, dropping blanks', async () => {
        const user = userEvent.setup()
        const { onPublish } = renderEditor()

        const levels = screen.getAllByLabelText(/levels/i)[0]
        await user.clear(levels)
        await user.type(levels, ' KS3 ,, A-level ')
        await user.click(publishButton())

        expect(onPublish).toHaveBeenCalledTimes(1)
        const published = onPublish.mock.calls[0][0] as SiteContent
        expect(published.subjects[0]).toEqual({
            ...defaultSiteContent.subjects[0],
            keyStages: ['KS3', 'A-level'],
        })
    })

    it('adds a subject; an unnamed row is dropped and never arms Publish', async () => {
        const user = userEvent.setup()
        const { onPublish } = renderEditor()

        await user.click(screen.getByRole('button', { name: /add subject/i }))
        // The empty row assembles to nothing, so there is nothing to publish.
        expect(publishButton()).toBeDisabled()

        const names = screen.getAllByLabelText(/^subject$/i)
        await user.type(names[names.length - 1], 'Further Maths')
        await user.click(publishButton())

        const published = onPublish.mock.calls[0][0] as SiteContent
        // No spec lists typed, so none are published for the new subject.
        expect(published.subjects).toHaveLength(5)
        expect(published.subjects[4]).toEqual({ name: 'Further Maths' })
    })

    it('removes a subject row', async () => {
        const user = userEvent.setup()
        const { onPublish } = renderEditor()

        await user.click(
            screen.getByRole('button', { name: /remove mathematics/i })
        )
        await user.click(publishButton())

        const published = onPublish.mock.calls[0][0] as SiteContent
        expect(
            published.subjects.map((subject) => subject.name)
        ).toEqual(['Physics', 'Chemistry', 'Biology'])
    })

    it('adds and removes selling points and journey steps', async () => {
        const user = userEvent.setup()
        const { onPublish } = renderEditor()

        await user.click(screen.getByRole('button', { name: /add step/i }))
        const titles = screen.getAllByLabelText(/^title$/i)
        fireEvent.change(titles[3 + 1], {
            target: { value: 'Exam-week boosters' },
        })

        await user.click(
            screen.getByRole('button', {
                name: /remove parents kept in the loop/i,
            })
        )
        await user.click(publishButton())

        const published = onPublish.mock.calls[0][0] as SiteContent
        expect(published.journey.map((step) => step.title)).toEqual([
            'Enquire',
            'Free assessment',
            'A matched plan',
            'Weekly sessions',
            'Exam-week boosters',
        ])
        expect(published.approach).toHaveLength(3)
    })

    it('publishes edits to the hero, a step detail and the free-form section', async () => {
        const user = userEvent.setup()
        const { onPublish } = renderEditor()

        fireEvent.change(screen.getByLabelText(/sub-headline/i), {
            target: {
                value: `${defaultSiteContent.hero.subhead} Online too.`,
            },
        })
        fireEvent.change(screen.getByLabelText(/availability line/i), {
            target: { value: 'Two places left this term.' },
        })
        fireEvent.change(screen.getAllByLabelText(/exam boards/i)[0], {
            target: { value: 'WJEC' },
        })
        fireEvent.change(screen.getAllByLabelText(/delivery/i)[0], {
            target: { value: '' },
        })
        fireEvent.change(screen.getAllByLabelText(/^detail$/i)[0], {
            target: { value: 'Tell us what your child needs.' },
        })
        fireEvent.change(screen.getByLabelText(/^heading/i), {
            target: { value: 'Term dates' },
        })
        fireEvent.change(screen.getByLabelText(/body \(markdown\)/i), {
            target: { value: '- Autumn: 1 Sep' },
        })
        await user.click(publishButton())

        const published = onPublish.mock.calls[0][0] as SiteContent
        expect(published.hero.subhead).toBe(
            `${defaultSiteContent.hero.subhead} Online too.`
        )
        expect(published.hero.availability).toBe('Two places left this term.')
        expect(published.subjects[0].examBoards).toEqual(['WJEC'])
        // A cleared spec list is omitted, not published empty.
        expect(published.subjects[0].modes).toBeUndefined()
        expect(published.journey[0].detail).toBe(
            'Tell us what your child needs.'
        )
        expect(published.freeform).toEqual({
            heading: 'Term dates',
            markdown: '- Autumn: 1 Sep',
        })
        // Rendering the full editor under coverage is slow on CI runners.
    }, 30000)

    it('blocks publishing without a site name or headline', () => {
        renderEditor()

        fireEvent.change(screen.getByLabelText(/site name/i), {
            target: { value: '' },
        })
        expect(
            screen.getByText(/required — headings like/i)
        ).toBeInTheDocument()
        // The document differs now, but the required field holds Publish back.
        expect(publishButton()).toBeDisabled()
    })

    it('discards edits back to the published document', async () => {
        const user = userEvent.setup()
        renderEditor()

        fireEvent.change(screen.getByLabelText(/^headline/i), {
            target: { value: 'Something else entirely' },
        })
        await user.click(
            screen.getByRole('button', { name: /discard changes/i })
        )

        expect(screen.getByLabelText(/^headline/i)).toHaveValue(
            defaultSiteContent.hero.headline
        )
        expect(publishButton()).toBeDisabled()
    })

    it('previews unsaved edits exactly as the Offerings page renders them', async () => {
        const user = userEvent.setup()
        renderEditor()

        // The availability line — the hero's headline no longer renders
        // on Offerings (owner call, 2026-08-07), but availability does.
        fireEvent.change(screen.getByLabelText(/availability/i), {
            target: { value: 'Preview me before anyone else.' },
        })
        await user.click(screen.getByRole('tab', { name: /preview/i }))

        // The public page's rendering, fed the draft — unsaved edit included.
        expect(
            screen.getByText('Preview me before anyone else.')
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: 'Mathematics' })
        ).toBeInTheDocument()
        expect(screen.getByText(/including your unsaved changes/i))
            .toBeInTheDocument()

        // And back: the edit survives the round trip through the tabs.
        await user.click(screen.getByRole('tab', { name: /edit/i }))
        expect(screen.getByLabelText(/availability/i)).toHaveValue(
            'Preview me before anyone else.'
        )
    })

    it('adopts a document landing from the API until the first edit', () => {
        const fetched: SiteContent = {
            ...defaultSiteContent,
            siteName: 'Harbour Tuition',
        }
        const { rerender } = renderEditor()

        // Untouched: the fetch replacing the fallback refills the form.
        rerender(
            <MemoryRouter>
                <SiteEditorView
                    content={fetched}
                    publishing={false}
                    onPublish={vi.fn()}
                />
            </MemoryRouter>
        )
        expect(screen.getByLabelText(/site name/i)).toHaveValue(
            'Harbour Tuition'
        )

        // Touched: a later background copy must not clobber the edit.
        fireEvent.change(screen.getByLabelText(/^headline/i), {
            target: { value: 'Hands off my draft' },
        })
        rerender(
            <MemoryRouter>
                <SiteEditorView
                    content={{ ...fetched, siteName: 'Late Arrival' }}
                    publishing={false}
                    onPublish={vi.fn()}
                />
            </MemoryRouter>
        )
        expect(screen.getByLabelText(/^headline/i)).toHaveValue(
            'Hands off my draft'
        )
        expect(screen.getByLabelText(/site name/i)).toHaveValue(
            'Harbour Tuition'
        )
    })

    it('shows the in-flight state while publishing', () => {
        renderEditor({ publishing: true })

        expect(
            screen.getByRole('button', { name: /publishing…/i })
        ).toBeDisabled()
    })

    it('points at the About page and passes the bio through untouched', async () => {
        const user = userEvent.setup()
        const { onPublish } = renderEditor()

        expect(
            screen.getByRole('link', { name: /open the about page/i })
        ).toHaveAttribute('href', '/about')
        // No bio fields are editable in the site editor any more.
        expect(
            screen.queryByLabelText(/about you/i)
        ).not.toBeInTheDocument()

        fireEvent.change(screen.getByLabelText(/^headline/i), {
            target: { value: 'Tutoring that clicks.' },
        })
        await user.click(publishButton())
        const published = onPublish.mock.calls[0][0] as SiteContent
        expect(published.bio).toEqual(defaultSiteContent.bio)
    }, 30000)

    it('points at the FAQ page instead of editing the FAQ here (2026-08-04)', () => {
        renderEditor()

        expect(
            screen.getByRole('link', { name: /open the faq page/i })
        ).toHaveAttribute('href', '/faq')
        // No FAQ rows are editable in the site editor any more.
        expect(
            screen.queryByLabelText(/^question$/i)
        ).not.toBeInTheDocument()
    })
})
