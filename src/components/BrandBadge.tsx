import { useState } from 'react'

/**
 * The AbhiTutor badge (REQ-035's short mark): navy disc, sky ring, the
 * Alex Brush "A" in sky-light, a solid white "T" (no border — owner call),
 * and the green ink tick. Self-contained — it brings its own dark ground,
 * so unlike the lockup it can sit on any surface, light cards included.
 *
 * Sizes proportionally from the `size` prop; below 40 px the tick bows out
 * (detail that can't be seen shouldn't be drawn).
 */
export const BrandBadge = ({ size = 48 }: { size?: number }) => {
    // Once the fly-in has played, it is disarmed — otherwise CSS would
    // replay the entrance every time a hover animation ends.
    const [entered, setEntered] = useState(false)
    return (
    <span
        className={`brand-badge ${entered ? 'entered' : ''}`}
        onAnimationEnd={(event) => {
            if (event.animationName === 'brand-badge-fly-in') {
                setEntered(true)
            }
        }}
        style={{
            width: size,
            height: size,
            borderWidth: Math.max(2, Math.round(size * 0.04)),
        }}
        aria-hidden
    >
        <span className="brand-badge-word">
            <span className="brand-badge-a" style={{ fontSize: size * 0.44 }}>
                A
            </span>
            <span className="brand-badge-t" style={{ fontSize: size * 0.29 }}>
                T
            </span>
        </span>
        {size >= 40 && (
            <svg
                className="brand-badge-tick"
                width={size * 0.36}
                height={size * 0.08}
                viewBox="0 0 54 10"
            >
                <path d="M2 6 C 14 9, 30 3, 52 4.4 C 32 5.8, 14 9.6, 2 6 Z" />
                <ellipse cx="4" cy="6.2" rx="1.6" ry="0.9" />
            </svg>
        )}
    </span>
    )
}
