import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { reorderIds, SortableItem, SortableList } from './SortableList'

describe('reorderIds', () => {
    const ids = ['hero', 'subjects', 'journey']

    it('moves the dragged id to the drop target position', () => {
        expect(reorderIds(ids, 'journey', 'hero')).toEqual([
            'journey',
            'hero',
            'subjects',
        ])
        expect(reorderIds(ids, 'hero', 'journey')).toEqual([
            'subjects',
            'journey',
            'hero',
        ])
    })

    it('returns the same list when dropped nowhere or on itself', () => {
        expect(reorderIds(ids, 'hero', null)).toBe(ids)
        expect(reorderIds(ids, 'hero', 'hero')).toBe(ids)
    })
})

describe('SortableList', () => {
    it('renders items with accessible drag grips', () => {
        render(
            <SortableList ids={['a', 'b']} onReorder={vi.fn()}>
                <SortableItem id="a" label="Reorder Mathematics">
                    <span>Mathematics</span>
                </SortableItem>
                <SortableItem id="b" label="Reorder Physics">
                    <span>Physics</span>
                </SortableItem>
            </SortableList>
        )

        // Each row carries a focusable grip — the keyboard path to reordering.
        expect(
            screen.getByRole('button', { name: 'Reorder Mathematics' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Reorder Physics' })
        ).toBeInTheDocument()
        expect(screen.getByText('Mathematics')).toBeInTheDocument()
    })
})
