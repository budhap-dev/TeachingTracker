import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ enabled: true, connected: true }))
vi.mock('../auth/msal', () => ({
    isOneDriveEnabled: () => state.enabled,
    isOneDriveConnected: async () => state.connected,
}))

import { useOneDriveStatus } from './useOneDrive'

describe('useOneDriveStatus', () => {
    it('is off when the build has the feature switched off', () => {
        state.enabled = false
        expect(renderHook(useOneDriveStatus).result.current).toBe('off')
        state.enabled = true
    })

    it('checks, then reports connected or not', async () => {
        state.connected = true
        const { result } = renderHook(useOneDriveStatus)
        expect(result.current).toBe('checking')
        await waitFor(() => expect(result.current).toBe('connected'))

        state.connected = false
        const second = renderHook(useOneDriveStatus)
        await waitFor(() => expect(second.result.current).toBe('disconnected'))
    })

    it('ignores an answer that arrives after unmount', async () => {
        const { unmount } = renderHook(useOneDriveStatus)
        unmount()
        await new Promise((resolve) => setTimeout(resolve, 0))
    })
})
