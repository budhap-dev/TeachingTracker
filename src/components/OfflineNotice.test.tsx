import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OfflineNotice } from './OfflineNotice'

/** jsdom reports online by default; each test says what it wants. */
const setOnline = (online: boolean) =>
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online)

/** The probe: a reachable origin answers, an unreachable one rejects. */
const setReachable = (reachable: boolean) =>
    vi.stubGlobal(
        'fetch',
        vi.fn(() =>
            reachable
                ? Promise.resolve(new Response('{}'))
                : Promise.reject(new TypeError('Failed to fetch'))
        )
    )

const fireConnection = (event: 'online' | 'offline') =>
    act(() => {
        window.dispatchEvent(new Event(event))
    })

afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

describe('OfflineNotice', () => {
    it('says nothing while the origin answers', async () => {
        setOnline(true)
        setReachable(true)
        render(<OfflineNotice />)

        await waitFor(() => expect(fetch).toHaveBeenCalled())
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('explains a quiet page when the app opens offline (REQ-044)', async () => {
        setOnline(false)
        setReachable(false)
        render(<OfflineNotice />)

        // role=status, so a screen reader hears it without stealing focus.
        expect(
            await screen.findByRole('status')
        ).toHaveTextContent(
            /you’re offline — this is the last version saved to your device/i
        )
    })

    it('trusts the probe over navigator.onLine, which lies on a cached launch', async () => {
        // The service worker served the whole page, so the browser never
        // noticed the network is gone (REQ-044) — the probe is what knows.
        setOnline(true)
        setReachable(false)
        render(<OfflineNotice />)

        expect(await screen.findByRole('status')).toBeInTheDocument()
    })

    it('appears and clears as the connection comes and goes', async () => {
        setOnline(true)
        setReachable(true)
        render(<OfflineNotice />)
        await waitFor(() => expect(fetch).toHaveBeenCalled())

        fireConnection('offline')
        expect(screen.getByRole('status')).toBeInTheDocument()

        setReachable(true)
        fireConnection('online')
        await waitFor(() =>
            expect(screen.queryByRole('status')).not.toBeInTheDocument()
        )
    })
})
