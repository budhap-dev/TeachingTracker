import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

let mockAccounts: { username: string; tenantId: string }[] = []
let mockInProgress = 'none'
vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({ accounts: mockAccounts, inProgress: mockInProgress }),
}))
vi.mock('./msal', () => ({
    isTeacherAccount: (account: { tenantId: string }) =>
        account.tenantId === 'tenant-1',
}))

import { useAuthSettled, useIsTeacher, useTeacherAccount } from './useTeacher'

const tenant = { username: 't@example.com', tenantId: 'tenant-1' }
const personal = { username: 'p@outlook.com', tenantId: 'msa' }

afterEach(() => {
    mockAccounts = []
    mockInProgress = 'none'
})

describe('useTeacherAccount / useIsTeacher', () => {
    it('finds the tenant account wherever it sits in the cache', () => {
        mockAccounts = [personal, tenant]
        expect(renderHook(useTeacherAccount).result.current).toBe(tenant)
        expect(renderHook(useIsTeacher).result.current).toBe(true)
    })

    it('does not count a personal account alone as the teacher', () => {
        mockAccounts = [personal]
        expect(renderHook(useTeacherAccount).result.current).toBeNull()
        expect(renderHook(useIsTeacher).result.current).toBe(false)
    })
})

describe('useAuthSettled', () => {
    it.each([
        ['startup', false],
        ['handleRedirect', false],
        ['none', true],
        ['acquireToken', true],
    ])('%s → %s', (status, settled) => {
        mockInProgress = status
        expect(renderHook(useAuthSettled).result.current).toBe(settled)
    })
})
