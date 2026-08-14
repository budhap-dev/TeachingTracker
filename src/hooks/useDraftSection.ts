import { useEffect, useRef, useState } from 'react'

/**
 * The edited-in-place machinery, in one place (REQ-046).
 *
 * Every teacher-editable page — About, FAQ, Pricing — needs the same three
 * behaviours, and each had hand-rolled them:
 *
 * 1. **Adopt until edited.** A document refreshed from the API replaces the
 *    draft only while the teacher has not typed. After their first edit the
 *    draft is theirs, and a late fetch must not overwrite it.
 * 2. **A canonicalised dirty check.** The published side goes through the
 *    SAME `assemble` path before comparison. Comparing raw against assembled
 *    kept Publish lit forever, because the API's key order differs from ours
 *    (owner report, 2026-08-06) — a bug that then had to be fixed in three
 *    separate copies, which is why this hook exists.
 * 3. **Assembly for publish.** What the page would publish, ready to send.
 *
 * A new editable page supplies only its `toDraft`/`assemble` pair.
 *
 * `Source` is the published slice (a `BioSection`, a `FaqItem[]`, a
 * `PricingSection`); `Draft` is whatever shape the form finds convenient —
 * keyed rows, split fields, anything `assemble` can turn back.
 */
export const useDraftSection = <Source, Draft>({
    source,
    toDraft,
    assemble,
}: {
    /** The published slice, straight from the document. */
    source: Source
    /** Published shape → the form's working shape. */
    toDraft: (source: Source) => Draft
    /** The form's working shape → publishable shape. */
    assemble: (draft: Draft) => Source
}) => {
    const [draft, setDraft] = useState<Draft>(() => toDraft(source))
    const [edited, setEdited] = useState(false)

    // Held in a ref so a caller may pass inline functions: as effect deps
    // their identity changes every render, and the adopt below would then
    // set state every render — a re-render loop. Only `source` and `edited`
    // decide when to adopt, exactly as the three hand-rolled copies did.
    const shape = useRef({ toDraft, assemble })
    shape.current = { toDraft, assemble }

    useEffect(() => {
        if (!edited) {
            setDraft(shape.current.toDraft(source))
        }
    }, [source, edited])

    /** Apply a change and hand the draft to the teacher for good. */
    const edit = (mutate: (current: Draft) => Draft) => {
        setEdited(true)
        setDraft(mutate)
    }

    const assembled = assemble(draft)

    return {
        draft,
        edit,
        /** What Publish would send. */
        assembled,
        /** Both sides assembled, so field order can never light Publish. */
        dirty:
            JSON.stringify(assembled) !==
            JSON.stringify(assemble(toDraft(source))),
    }
}
