import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

const draw = (markdown: string) => render(<>{renderMarkdown(markdown)}</>)

describe('renderMarkdown', () => {
    it('renders paragraphs with bold, italic and links', () => {
        draw('Lessons run **weekly**, *in person*, see [terms](/contact).')

        expect(screen.getByText('weekly').tagName).toBe('STRONG')
        expect(screen.getByText('in person').tagName).toBe('EM')
        const link = screen.getByRole('link', { name: 'terms' })
        expect(link).toHaveAttribute('href', '/contact')
        // Same-site links stay in-tab.
        expect(link).not.toHaveAttribute('target')
    })

    it('opens external links in a new tab, safely', () => {
        draw('[exam board](https://aqa.org.uk)')
        const link = screen.getByRole('link', { name: 'exam board' })
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noreferrer')
    })

    it('renders javascript: links as plain text, never anchors', () => {
        draw('[click me](javascript:alert(1))')
        expect(screen.queryByRole('link')).not.toBeInTheDocument()
        expect(screen.getByText(/click me/)).toBeInTheDocument()
    })

    it('renders headings at h4 and below — the page owns h1–h3', () => {
        draw('# Term dates\n\n## Autumn\n\n### Details')
        expect(screen.getByText('Term dates').tagName).toBe('H4')
        expect(screen.getByText('Autumn').tagName).toBe('H5')
        expect(screen.getByText('Details').tagName).toBe('H6')
    })

    it('renders bulleted and numbered lists', () => {
        draw('- one\n- two\n\n1. first\n2. second')

        const lists = screen.getAllByRole('list')
        expect(lists[0].tagName).toBe('UL')
        expect(lists[1].tagName).toBe('OL')
        expect(screen.getAllByRole('listitem')).toHaveLength(4)
        expect(screen.getByText('second')).toBeInTheDocument()
    })

    it('treats stray HTML as literal text, not elements', () => {
        // The API strips tags on write; even if one slipped through, it must
        // render as text — there is no HTML parsing on this path.
        draw('Hello <b>world</b>')
        expect(screen.getByText(/Hello <b>world<\/b>/)).toBeInTheDocument()
        expect(document.querySelector('b')).toBeNull()
    })

    it('renders nothing for an empty body', () => {
        const { container } = draw('')
        expect(container).toBeEmptyDOMElement()
    })

    it('keeps single newlines inside one paragraph', () => {
        draw('line one\nline two')
        expect(
            screen.getByText(/line one\s*line two/).tagName
        ).toBe('P')
    })
})
