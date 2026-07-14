import '@testing-library/jest-dom'
import { afterEach, beforeEach, expect, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Reset the URL before each test so BrowserRouter-based renders always start
// from the dashboard route and don't leak navigation state between tests.
beforeEach(() => {
    window.history.pushState({}, '', '/')
})

afterEach(() => {
    cleanup()
})

vi.stubGlobal('expect', expect)
