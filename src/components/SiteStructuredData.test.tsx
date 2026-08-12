import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Provider } from 'react-redux'
import { SiteStructuredData } from './SiteStructuredData'
import { defaultSiteContent } from '../data/siteContent'
import { store } from '../store/store'

const renderBlock = () =>
    render(
        <Provider store={store}>
            <SiteStructuredData
                content={defaultSiteContent}
                testimonials={[]}
            />
        </Provider>
    )

const blockData = () => {
    const script = document.getElementById('ld-local-business')
    return script ? JSON.parse(script.textContent ?? '{}') : undefined
}

describe('SiteStructuredData', () => {
    it('publishes one valid LocalBusiness block, and clears it on unmount', () => {
        const { unmount } = renderBlock()

        const data = blockData()
        expect(data['@type']).toBe('LocalBusiness')
        expect(data.name).toBe('AbhiTutor')
        expect(document.getElementById('ld-local-business')?.getAttribute('type')).toBe(
            'application/ld+json'
        )

        // The teacher's screens must not carry the public markup.
        unmount()
        expect(document.getElementById('ld-local-business')).toBeNull()
    })

    it('keeps a single block when the landing remounts', () => {
        const first = renderBlock()
        const second = renderBlock()

        expect(
            document.querySelectorAll('script#ld-local-business')
        ).toHaveLength(1)
        first.unmount()
        second.unmount()
    })
})
