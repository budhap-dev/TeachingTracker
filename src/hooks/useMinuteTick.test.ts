import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMinuteTick } from './useMinuteTick'

beforeEach(() => {
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
})

describe('useMinuteTick', () => {
    // The dashboard is a screen people leave open all morning; read once at
    // mount, "what's coming up" would keep offering a reminder that had gone.
    it('moves the clock on once a minute', () => {
        const { result } = renderHook(() => useMinuteTick())
        const first = result.current

        act(() => {
            vi.advanceTimersByTime(60_000)
        })

        expect(result.current.getTime()).toBeGreaterThan(first.getTime())
    })

    it('stops ticking once the screen is gone', () => {
        const clearInterval = vi.spyOn(globalThis, 'clearInterval')
        const { unmount } = renderHook(() => useMinuteTick())

        unmount()

        expect(clearInterval).toHaveBeenCalled()
    })
})
