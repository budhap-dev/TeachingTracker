import { useEffect, useMemo, useState } from 'react'
import { createTheme } from '@mui/material/styles'
import { themePresets, type ThemeName } from '../utils/constants'

const THEME_STORAGE_KEY = 'teachtrack-theme'

const readStoredTheme = (): ThemeName => {
    const storedTheme = window.localStorage.getItem(
        THEME_STORAGE_KEY
    ) as ThemeName | null
    return storedTheme && themePresets[storedTheme] ? storedTheme : 'summer'
}

/**
 * Owns the active colour theme: persistence to localStorage, the
 * `data-theme` attribute on the document, and the derived MUI theme.
 */
export const useTheme = () => {
    const [theme, setTheme] = useState<ThemeName>(readStoredTheme)

    const activeTheme = themePresets[theme]
    // The preset says whether it's a dark theme — no name lists to maintain.
    const isDark = activeTheme.appearance === 'dark'

    const muiTheme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: isDark ? 'dark' : 'light',
                    primary: { main: activeTheme.primary },
                    secondary: { main: activeTheme.secondary },
                    background: {
                        default: isDark ? activeTheme.paper : '#f8fafc',
                        paper: activeTheme.paper,
                    },
                    text: {
                        primary: isDark ? '#f8fafc' : '#0f172a',
                    },
                },
                components: {
                    // Every MUI button reads the shared corner token, so
                    // Material and hand-styled buttons round identically.
                    MuiButton: {
                        styleOverrides: {
                            root: { borderRadius: 'var(--radius-button)' },
                        },
                    },
                },
            }),
        [activeTheme.primary, activeTheme.secondary, activeTheme.paper, isDark]
    )

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    }, [theme])

    return { theme, setTheme, activeTheme, muiTheme }
}
