import { useEffect, useRef, useState } from 'react'
import { subjectIcon } from '../utils/subjectIcons'
import { subjectEmoji } from '../utils/subjectEmoji'

/**
 * One spark per emoji in the subject's set — never a count of its own.
 *
 * It was nine at one point, drawn from a set of five, which meant four of them
 * appeared twice and the burst read as a repeat rather than a handful of
 * different things (owner report, 2026-08-16). Tying the burst to the set is
 * what makes that impossible rather than merely unlikely.
 */

/**
 * The animation lengths live here rather than in the stylesheet, and are set
 * inline on each element, so ONE number drives both how long the animation
 * runs and when its element is removed.
 *
 * Removal is on a timer rather than `animationend` for two reasons. A
 * cancelled animation fires `animationcancel` and never `animationend`, which
 * would strand an emoji mid-flight. And jsdom has no `AnimationEvent` at all,
 * so an `animationend` cleanup could never be tested — the tidying up would
 * have been the one part of this taken on trust.
 */
const SPARK_MS = 700
const GLOW_MS = 520

type Spark = {
    id: number
    subject: string
    emoji: string
    /** Where it flies, as CSS custom properties — transform only, no layout. */
    dx: number
    dy: number
    rotate: number
    delay: number
}

type SubjectChipsProps = {
    /** The published subjects, in the teacher's order. */
    subjects: string[]
}

/**
 * "What we teach", as chips that play when tapped (REQ-051).
 *
 * The chips stopped navigating on 2026-08-11 (owner call) — the band's
 * "Explore subjects" button is the door — which freed the tap for something
 * else. Tapping one throws that subject's own emoji, the same set the
 * Offerings flip cards use, so the play is subject-flavoured rather than
 * generic confetti.
 *
 * They are buttons because a keyboard has to be able to play too. The sparks
 * are `aria-hidden` and carry no text of their own: a screen reader hears
 * "Mathematics, button" and nothing more, rather than a stream of emoji names.
 */
export const SubjectChips = ({ subjects }: SubjectChipsProps) => {
    const [sparks, setSparks] = useState<Spark[]>([])
    // Chips that answered a reduced-motion tap with a quiet glow instead.
    const [lit, setLit] = useState<string[]>([])
    const nextId = useRef(0)
    const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

    /** Every timer is held so an unmount mid-flight leaves nothing running. */
    const later = (run: () => void, ms: number) => {
        const timer = setTimeout(() => {
            timers.current.delete(timer)
            run()
        }, ms)
        timers.current.add(timer)
    }

    useEffect(() => {
        const running = timers.current
        return () => {
            running.forEach(clearTimeout)
            running.clear()
        }
    }, [])

    const play = (subject: string) => {
        // The same reading the home page's notice scroll uses. Defaulting to
        // "reduce" when matchMedia is missing keeps the quiet variant the
        // fallback rather than the burst.
        const reduced =
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
            true
        if (reduced) {
            setLit((current) =>
                current.includes(subject) ? current : [...current, subject]
            )
            later(
                () => setLit((current) => current.filter((name) => name !== subject)),
                GLOW_MS
            )
            return
        }
        const burst = subjectEmoji(subject).map((emoji, index) => ({
            id: nextId.current++,
            subject,
            emoji,
            // A fan upwards and out, never the same twice. Widened on the
            // owner's word (2026-08-16) so the five land apart instead of
            // overlapping near the chip — the timing and the arc are
            // untouched, only the distance. Safe to throw this wide because
            // sparks are absolutely positioned and take no pointer events:
            // nothing they fly over moves or blocks.
            dx: Math.round((Math.random() - 0.5) * 260),
            dy: Math.round(-55 - Math.random() * 85),
            rotate: Math.round((Math.random() - 0.5) * 160),
            delay: Math.round(index * 18),
        }))
        setSparks((current) => [...current, ...burst])
        burst.forEach((spark) =>
            later(
                () =>
                    setSparks((current) =>
                        current.filter((item) => item.id !== spark.id)
                    ),
                SPARK_MS + spark.delay
            )
        )
    }

    if (subjects.length === 0) {
        return null
    }

    return (
        <div className="home-subject-chips" aria-label="Subjects taught">
            {subjects.map((subject) => {
                const Icon = subjectIcon(subject)
                return (
                    <button
                        type="button"
                        key={subject}
                        className={
                            lit.includes(subject)
                                ? 'home-subject-chip is-lit'
                                : 'home-subject-chip'
                        }
                        onClick={() => play(subject)}
                        style={{ animationDuration: `${GLOW_MS}ms` }}
                    >
                        <Icon fontSize="small" aria-hidden />
                        {subject}
                        {sparks
                            .filter((spark) => spark.subject === subject)
                            .map((spark) => (
                                <span
                                    key={spark.id}
                                    className="chip-spark"
                                    aria-hidden
                                    style={
                                        {
                                            '--dx': `${spark.dx}px`,
                                            '--dy': `${spark.dy}px`,
                                            '--rotate': `${spark.rotate}deg`,
                                            animationDelay: `${spark.delay}ms`,
                                            animationDuration: `${SPARK_MS}ms`,
                                        } as React.CSSProperties
                                    }
                                >
                                    {spark.emoji}
                                </span>
                            ))}
                    </button>
                )
            })}
        </div>
    )
}
