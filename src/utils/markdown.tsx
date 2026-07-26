import type { ReactNode } from 'react'

/**
 * Renders the free-form section's Markdown (REQ-008) to React nodes.
 *
 * Safe by construction: the output is built element-by-element — there is no
 * HTML parsing and no `dangerouslySetInnerHTML` anywhere, so even if raw
 * markup survived the API's write-time strip, it would render as literal
 * text, never as elements. The allow-list is exactly the story's: headings,
 * bold, italic, bulleted/numbered lists and links.
 */

/** Splits inline markdown — links, **bold**, *italic* — into React nodes. */
const renderInline = (text: string, keyBase: string): ReactNode[] => {
    const nodes: ReactNode[] = []
    // One pass over the three inline forms; earliest match wins each round.
    const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/
    let rest = text
    let index = 0
    while (rest) {
        const match = pattern.exec(rest)
        if (!match) {
            nodes.push(rest)
            break
        }
        if (match.index > 0) {
            nodes.push(rest.slice(0, match.index))
        }
        const key = `${keyBase}-${index++}`
        if (match[1] !== undefined) {
            // Links: same-site paths and http(s) only — anything else (e.g.
            // javascript:) renders as plain text.
            const href = match[2]
            if (/^(https?:\/\/|\/)/.test(href)) {
                nodes.push(
                    <a
                        key={key}
                        href={href}
                        {...(href.startsWith('/')
                            ? {}
                            : { target: '_blank', rel: 'noreferrer' })}
                    >
                        {match[1]}
                    </a>
                )
            } else {
                nodes.push(match[1])
            }
        } else if (match[3] !== undefined) {
            nodes.push(<strong key={key}>{match[3]}</strong>)
        } else {
            nodes.push(<em key={key}>{match[4]}</em>)
        }
        rest = rest.slice(match.index + match[0].length)
    }
    return nodes
}

/** True when every line of the block matches the given list marker. */
const isList = (lines: string[], marker: RegExp): boolean =>
    lines.every((line) => marker.test(line.trim()))

const BULLET = /^[-*]\s+/
const NUMBERED = /^\d+\.\s+/

/** Renders a Markdown body to a list of block-level React nodes. */
export const renderMarkdown = (markdown: string): ReactNode[] =>
    markdown
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block, blockIndex) => {
            const key = `md-${blockIndex}`
            const lines = block.split('\n')

            const headingMatch = /^(#{1,3})\s+(.*)$/.exec(block)
            if (headingMatch && lines.length === 1) {
                const inline = renderInline(headingMatch[2], key)
                // h4/h5/h6: the page's own headings own h1–h3.
                if (headingMatch[1].length === 1) {
                    return <h4 key={key}>{inline}</h4>
                }
                if (headingMatch[1].length === 2) {
                    return <h5 key={key}>{inline}</h5>
                }
                return <h6 key={key}>{inline}</h6>
            }

            if (isList(lines, BULLET)) {
                return (
                    <ul key={key}>
                        {lines.map((line, lineIndex) => (
                            <li key={`${key}-${lineIndex}`}>
                                {renderInline(
                                    line.trim().replace(BULLET, ''),
                                    `${key}-${lineIndex}`
                                )}
                            </li>
                        ))}
                    </ul>
                )
            }
            if (isList(lines, NUMBERED)) {
                return (
                    <ol key={key}>
                        {lines.map((line, lineIndex) => (
                            <li key={`${key}-${lineIndex}`}>
                                {renderInline(
                                    line.trim().replace(NUMBERED, ''),
                                    `${key}-${lineIndex}`
                                )}
                            </li>
                        ))}
                    </ol>
                )
            }

            return <p key={key}>{renderInline(block, key)}</p>
        })
