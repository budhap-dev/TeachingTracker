import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ScrollToTop } from './ScrollToTop'

const renderAt = (path: string) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <ScrollToTop />
        </MemoryRouter>
    )

describe('ScrollToTop', () => {
    it('takes a plain route change back to the top', () => {
        const scrollTo = vi.fn()
        vi.stubGlobal('scrollTo', scrollTo)

        renderAt('/reviews')

        expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 })
    })

    // A link like /reviews#review-7 says exactly where the visitor wants to
    // be; jumping to the top would land them somewhere they never asked for.
    it('stays out of the way when the URL names an anchor', () => {
        const scrollTo = vi.fn()
        vi.stubGlobal('scrollTo', scrollTo)

        renderAt('/reviews#review-7')

        expect(scrollTo).not.toHaveBeenCalled()
    })
})
