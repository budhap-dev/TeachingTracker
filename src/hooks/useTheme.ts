import { useEffect, useMemo, useState } from 'react'
import { createTheme } from '@mui/material/styles'
import { themePresets, type ThemeName } from '../utils/constants'

const THEME_STORAGE_KEY = 'teachtrack-theme'

const readStoredTheme = (): ThemeName => {
    const storedTheme = window.localStorage.getItem(
        THEME_STORAGE_KEY
    ) as ThemeName | null
    return storedTheme && themePresets[storedTheme] ? storedTheme : 'ocean'
}

/**
 * Owns the active colour theme: persistence to localStorage, the
 * `data-theme` attribute on the document, and the derived MUI theme.
 */
export const useTheme = () => {
    const [theme, setTheme] = useState<ThemeName>(readStoredTheme)

    const activeTheme = themePresets[theme]

    const muiTheme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: theme === 'midnight' ? 'dark' : 'light',
                    primary: { main: activeTheme.primary },
                    secondary: { main: activeTheme.secondary },
                    background: {
                        default: theme === 'midnight' ? '#111827' : '#f8fafc',
                        paper: theme === 'midnight' ? '#111827' : '#ffffff',
                    },
                    text: {
                        primary: theme === 'midnight' ? '#f8fafc' : '#0f172a',
                    },
                },
            }),
        [activeTheme.primary, activeTheme.secondary, theme]
    )

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    }, [theme])

    return { theme, setTheme, activeTheme, muiTheme }
}
