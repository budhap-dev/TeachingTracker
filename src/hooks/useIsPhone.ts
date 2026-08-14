import { useEffect, useState } from 'react'

/** The phone breakpoint the stylesheet uses for the brand band. */
const PHONE_QUERY = '(max-width: 900px)'

/**
 * True while the viewport is phone-width. For the handful of places a
 * media query cannot reach — the brand badge sizes every glyph inside it
 * from a numeric prop, so growing it on phones (owner ask, 2026-08-14)
 * has to happen in React, not CSS.
 */
export const useIsPhone = (): boolean => {
    const [isPhone, setIsPhone] = useState(
        () => window.matchMedia?.(PHONE_QUERY).matches ?? false
    )
    useEffect(() => {
        const query = window.matchMedia?.(PHONE_QUERY)
        if (!query) {
            return
        }
        const onChange = (event: MediaQueryListEvent) =>
            setIsPhone(event.matches)
        setIsPhone(query.matches)
        query.addEventListener('change', onChange)
        return () => query.removeEventListener('change', onChange)
    }, [])
    return isPhone
}
