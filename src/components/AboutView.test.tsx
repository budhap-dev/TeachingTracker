import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { defaultSiteContent, emptyBio } from '../data/siteContent'
import type { SiteContent } from '../data/siteContent'
import { AboutView } from './AboutView'

// react-easy-crop needs real layout/ResizeObserver — jsdom has neither.
// The mock exposes a button that reports a crop/zoom back, the way the
// real widget does after a drag.
vi.mock('react-easy-crop', () => ({
    default: (props: {
        onCropChange?: (location: { x: number; y: number }) => void
        onZoomChange?: (zoom: number) => void
        onCropComplete?: (
            area: { x: number; y: number; width: number; height: number },
            areaPixels: {
                x: number
                y: number
                width: number
                height: number
            }
        ) => void
    }) => (
        <button
            type="button"
            onClick={() => {
                props.onCropChange?.({ x: 4, y: 6 })
                props.onZoomChange?.(2)
                props.onCropComplete?.(
                    { x: 0, y: 0, width: 50, height: 50 },
                    { x: 10, y: 10, width: 120, height: 120 }
                )
            }}
        >
            mock-drag
        </button>
    ),
}))

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
            screen.getByText(/BSc \(Hons\) Physics, First Class/)
        ).toBeInTheDocument()
        expect(screen.getByText('Tutor across the UK')).toBeInTheDocument()
        // Education retired from the prepared copy — the qualification
        // cards carry it; the empty list hides the timeline block.
        expect(
            screen.queryByRole('heading', { name: /^education$/i })
        ).not.toBeInTheDocument()
        expect(
            screen.getByText(/Personalised one-to-one tuition/)
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
            screen.getByRole('link', { name: /contact me/i })
        ).toHaveAttribute('href', '/contact')
        // A visitor gets no editing chrome.
        expect(
            screen.queryByRole('button', { name: /publish about/i })
        ).not.toBeInTheDocument()
    })

    it('hides the Contact-me door when every contact field is blank', () => {
        renderAbout({
            content: defaultSiteContent,
        })
        // Bare renders default the door open…
        expect(
            screen.getByRole('link', { name: /contact me/i })
        ).toBeInTheDocument()
    })

    it('drops the Contact-me door when told contact is unpublished', () => {
        render(
            <MemoryRouter>
                <AboutView
                    content={defaultSiteContent}
                    canEdit={false}
                    publishing={false}
                    onPublish={vi.fn()}
                    contactPublished={false}
                />
            </MemoryRouter>
        )
        expect(
            screen.queryByRole('link', { name: /contact me/i })
        ).not.toBeInTheDocument()
        // The assessment door stays.
        expect(
            screen.getByRole('link', { name: /request a free assessment/i })
        ).toBeInTheDocument()
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
    }, 30000)

    it('stays clean when the API serves the bio with other key order', () => {
        // The server serialises the same content with its own key order —
        // that must not read as unsaved changes (owner report, 2026-08-06).
        const served = Object.fromEntries(
            Object.entries(defaultSiteContent.bio).reverse()
        ) as SiteContent['bio']
        renderAbout({
            content: { ...defaultSiteContent, bio: served },
            canEdit: true,
        })

        expect(
            screen.getByRole('button', { name: /publish about/i })
        ).toBeDisabled()
        expect(
            screen.queryByText(/previewing unsaved changes/i)
        ).not.toBeInTheDocument()
    })

    it('edits every field in place and publishes the assembled bio', async () => {
        const user = userEvent.setup()
        const { onPublish } = renderAbout({ canEdit: true })

        // Text fields, one change each (single events — repo precedent).
        fireEvent.change(screen.getByLabelText(/page heading/i), {
            target: { value: 'Meet the tutor' },
        })
        // Editing switches the page into live preview: the public heading
        // shows the draft and the hint chip appears beside Publish.
        expect(
            screen.getByRole('heading', { name: /meet the tutor/i })
        ).toBeInTheDocument()
        expect(
            screen.getByText(/previewing unsaved changes/i)
        ).toBeInTheDocument()
        fireEvent.change(screen.getByLabelText(/introduction \(markdown\)/i), {
            target: { value: '**Hello there.**' },
        })
        fireEvent.change(screen.getByLabelText(/qualifications — one per/i), {
            target: { value: 'Line one\n  \nLine two' },
        })
        fireEvent.change(screen.getByLabelText(/safeguarding statement/i), {
            target: { value: ' Safeguarding comes first. ' },
        })
        fireEvent.change(
            screen.getByLabelText(/what you can expect — one per/i),
            { target: { value: 'Expect one\nExpect two' } }
        )
        await user.click(screen.getByRole('checkbox'))

        // First experience row, every column.
        fireEvent.change(screen.getAllByLabelText('Years')[0], {
            target: { value: ' 2020 — ' },
        })
        fireEvent.change(screen.getAllByLabelText('Title')[0], {
            target: { value: 'Lead tutor' },
        })
        fireEvent.change(screen.getAllByLabelText('Place')[0], {
            target: { value: 'Leeds' },
        })
        fireEvent.change(screen.getAllByLabelText('Detail')[0], {
            target: { value: 'One to one.' },
        })

        // Blank CV rows in both lists: one removed by hand, the other
        // dropped at publish (titleless rows are left out).
        const addEntryButtons = screen.getAllByRole('button', {
            name: /add entry/i,
        })
        await user.click(addEntryButtons[0])
        await user.click(addEntryButtons[1])
        await user.click(
            screen.getAllByRole('button', { name: /remove new entry/i })[0]
        )

        // Extra sections: fill one, remove the other blank one.
        const addSection = screen.getByRole('button', {
            name: /add section/i,
        })
        await user.click(addSection)
        await user.click(addSection)
        const headings = screen.getAllByLabelText('Heading')
        fireEvent.change(headings[headings.length - 2], {
            target: { value: 'A closing note' },
        })
        const bodies = screen.getAllByLabelText(/body \(markdown\)/i)
        fireEvent.change(bodies[bodies.length - 2], {
            target: { value: 'Thanks for reading.' },
        })
        await user.click(
            screen.getByRole('button', { name: /remove new section/i })
        )

        await user.click(
            screen.getByRole('button', { name: /publish about/i })
        )
        const published = onPublish.mock.calls[0][0] as SiteContent
        expect(published.bio.heading).toBe('Meet the tutor')
        expect(published.bio.body).toBe('**Hello there.**')
        expect(published.bio.qualifications).toEqual([
            'Line one',
            'Line two',
        ])
        expect(published.bio.dbsChecked).toBe(true)
        expect(published.bio.safeguarding).toBe('Safeguarding comes first.')
        expect(published.bio.expectations).toEqual([
            'Expect one',
            'Expect two',
        ])
        expect(published.bio.experience[0]).toEqual({
            years: '2020 —',
            title: 'Lead tutor',
            place: 'Leeds',
            detail: 'One to one.',
        })
        // The added blank rows never publish.
        expect(published.bio.experience).toHaveLength(
            defaultSiteContent.bio.experience.length
        )
        expect(published.bio.education).toEqual([])
        expect(published.bio.sections).toEqual([
            ...defaultSiteContent.bio.sections,
            { heading: 'A closing note', markdown: 'Thanks for reading.' },
        ])
    }, 30000)
})

describe('AboutView profile photo', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    /** jsdom loads no images: stand in an Image that settles on src. */
    const stubImage = (outcome: 'load' | 'error') => {
        class StubImage {
            onload: (() => void) | null = null
            onerror: (() => void) | null = null
            width = 480
            height = 360
            set src(value: string) {
                void value
                queueMicrotask(() =>
                    outcome === 'load' ? this.onload?.() : this.onerror?.()
                )
            }
        }
        vi.stubGlobal('Image', StubImage)
    }

    const pickPhoto = (type: string) => {
        const input = document.querySelector('input[type="file"]')!
        fireEvent.change(input, {
            target: {
                files: [new File(['photo-bytes'], 'photo.jpg', { type })],
            },
        })
    }

    it('shrinks a picked photo into the live preview, removable again', async () => {
        stubImage('load')
        // jsdom has no canvas rasteriser — stub the two calls the shrink
        // path makes.
        vi.spyOn(
            HTMLCanvasElement.prototype,
            'getContext'
        ).mockReturnValue({
            drawImage: vi.fn(),
        } as unknown as CanvasRenderingContext2D)
        vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
            'data:image/jpeg;base64,shrunk'
        )
        const user = userEvent.setup()
        renderAbout({ canEdit: true })

        pickPhoto('image/jpeg')
        // The crop dialog opens first (owner ask, 2026-08-06): position,
        // zoom, then confirm.
        await screen.findByText(/position your photo/i)
        // A drag reports crop + zoom back; the zoom slider moves too.
        await user.click(screen.getByRole('button', { name: 'mock-drag' }))
        fireEvent.change(
            screen.getByRole('slider', { name: /zoom/i }),
            { target: { value: 3 } }
        )
        await user.click(
            screen.getByRole('button', { name: /use photo/i })
        )
        const preview = await screen.findByAltText(/profile photo preview/i)
        expect(preview).toHaveAttribute(
            'src',
            'data:image/jpeg;base64,shrunk'
        )
        // The public region live-previews it too — adding a photo visibly
        // changes the page before publishing (owner report, 2026-08-06).
        expect(screen.getByAltText(/portrait of/i)).toHaveAttribute(
            'src',
            'data:image/jpeg;base64,shrunk'
        )

        // The dialog's exit transition must finish before the editor's
        // buttons are visible to the accessibility tree again.
        // Adjust crop reopens the dialog from the kept source image.
        await user.click(
            await screen.findByRole('button', { name: /adjust crop/i })
        )
        await screen.findByText(/position your photo/i)
        await user.click(screen.getByRole('button', { name: /cancel/i }))

        await user.click(
            await screen.findByRole('button', { name: /remove photo/i })
        )
        expect(
            screen.queryByAltText(/profile photo preview/i)
        ).not.toBeInTheDocument()
    }, 30000)

    it('keeps stepping the shrink down, then explains a hopeless photo', async () => {
        stubImage('load')
        vi.spyOn(
            HTMLCanvasElement.prototype,
            'getContext'
        ).mockReturnValue({
            drawImage: vi.fn(),
        } as unknown as CanvasRenderingContext2D)
        // Every attempt overflows the API's base64 ceiling.
        const toDataURL = vi
            .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
            .mockReturnValue('data:image/jpeg;base64,' + 'A'.repeat(20000))
        const user = userEvent.setup()
        renderAbout({ canEdit: true })

        pickPhoto('image/jpeg')
        await screen.findByText(/position your photo/i)
        await user.click(
            screen.getByRole('button', { name: /use photo/i })
        )
        expect(
            await screen.findByText(/too detailed to store/i)
        ).toBeInTheDocument()
        // It tried the whole quality/size ladder before giving up.
        expect(toDataURL.mock.calls.length).toBeGreaterThan(1)
    }, 30000)

    it('cancelling the crop keeps the page unchanged', async () => {
        stubImage('load')
        const user = userEvent.setup()
        renderAbout({ canEdit: true })

        pickPhoto('image/jpeg')
        await screen.findByText(/position your photo/i)
        await user.click(screen.getByRole('button', { name: /cancel/i }))
        expect(
            screen.queryByAltText(/profile photo preview/i)
        ).not.toBeInTheDocument()
    }, 30000)

    it('explains when a picked photo cannot be read (HEIC case)', async () => {
        stubImage('error')
        renderAbout({ canEdit: true })

        pickPhoto('image/heic')
        expect(
            await screen.findByText(/HEIC photos from iPhones sometimes fail/i)
        ).toBeInTheDocument()
        expect(
            screen.queryByAltText(/profile photo preview/i)
        ).not.toBeInTheDocument()
    }, 30000)
})
