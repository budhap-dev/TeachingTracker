import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDraftSection } from './useDraftSection'

/**
 * About, FAQ and Pricing all publish through this hook (REQ-046), so a
 * regression here is a regression on three pages at once — the reason it is
 * tested directly rather than only through them.
 */

/** A stand-in published slice and the form shape it is edited in. */
type Section = { title: string; lines: string[] }
type Draft = { title: string; lines: { key: string; text: string }[] }

let keys = 0
const toDraft = (section: Section): Draft => ({
    title: section.title,
    lines: section.lines.map((text) => ({ key: `row-${++keys}`, text })),
})

/** Trims, and drops blank rows — like every real assemble on the site. */
const assemble = (draft: Draft): Section => ({
    title: draft.title.trim(),
    lines: draft.lines
        .map((row) => row.text.trim())
        .filter((text) => text.length > 0),
})

const setup = (source: Section) =>
    renderHook(
        ({ current }: { current: Section }) =>
            useDraftSection({ source: current, toDraft, assemble }),
        { initialProps: { current: source } }
    )

describe('useDraftSection', () => {
    it('starts clean, and assembles what Publish would send', () => {
        const { result } = setup({ title: 'Pricing', lines: ['GCSE'] })

        expect(result.current.dirty).toBe(false)
        expect(result.current.assembled).toEqual({
            title: 'Pricing',
            lines: ['GCSE'],
        })
    })

    it('stays clean when the draft only differs by what assemble drops', () => {
        // The 2026-08-06 bug: Publish lit itself forever because the
        // published side was compared raw against an assembled draft. Both
        // sides go through assemble, so trimming and a blank new row — which
        // publish would discard anyway — are not changes.
        const { result } = setup({ title: 'Pricing', lines: ['GCSE'] })

        act(() =>
            result.current.edit((next) => ({
                ...next,
                title: '  Pricing  ',
                lines: [...next.lines, { key: 'row-new', text: '   ' }],
            }))
        )

        expect(result.current.dirty).toBe(false)
    })

    it('lights up for a real change', () => {
        const { result } = setup({ title: 'Pricing', lines: ['GCSE'] })

        act(() =>
            result.current.edit((next) => ({ ...next, title: 'Rates' }))
        )

        expect(result.current.dirty).toBe(true)
        expect(result.current.assembled.title).toBe('Rates')
    })

    it('adopts a document arriving from the API — until the first edit', () => {
        const { result, rerender } = setup({ title: 'Pricing', lines: [] })

        // A late fetch lands: nothing typed yet, so the page takes it.
        rerender({ current: { title: 'Published pricing', lines: ['GCSE'] } })
        expect(result.current.draft.title).toBe('Published pricing')

        // Now the teacher types. From here the draft is theirs, and a
        // refresh must not overwrite what they are part-way through.
        act(() => result.current.edit((next) => ({ ...next, title: 'Mine' })))
        rerender({ current: { title: 'Another fetch', lines: ['A-level'] } })

        expect(result.current.draft.title).toBe('Mine')
        expect(result.current.dirty).toBe(true)
    })
})
