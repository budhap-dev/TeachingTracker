import { useMemo, useState } from 'react'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import { TopbarAuth, TopbarGreeting } from './TopbarAuth'
import {
    teacherQuotes,
    themePresets,
    type ThemeName,
    type ThemePreset,
} from '../utils/constants'

type TopbarProps = {
    theme: ThemeName
    activeTheme: ThemePreset
    onSelectTheme: (theme: ThemeName) => void
}

export const Topbar = ({ theme, activeTheme, onSelectTheme }: TopbarProps) => {
    const [isThemePickerOpen, setIsThemePickerOpen] = useState(false)
    const dailyQuote = useMemo(
        () => teacherQuotes[Math.floor(Math.random() * teacherQuotes.length)],
        []
    )

    return (
        <header className="topbar">
            <TopbarGreeting quote={dailyQuote} />
            <div className="topbar-actions">
                <div className="theme-picker" aria-label="Theme selector">
                    <button
                        type="button"
                        className="theme-toggle"
                        onClick={() =>
                            setIsThemePickerOpen((current) => !current)
                        }
                        title={`Theme: ${activeTheme.label}`}
                        aria-label={
                            isThemePickerOpen
                                ? 'Hide theme options'
                                : 'Show theme options'
                        }
                    >
                        {/* Quiet chrome: a palette glyph plus the current
                            theme's own colours — the name lives in the
                            tooltip, not shouted across the topbar. */}
                        <PaletteOutlinedIcon fontSize="small" />
                        <span
                            className="theme-toggle-dot"
                            style={{
                                background: `linear-gradient(135deg, ${activeTheme.accent} 50%, ${activeTheme.accentAlt} 50%)`,
                            }}
                        />
                    </button>
                    {isThemePickerOpen && (
                        <div className="theme-swatches">
                            {(
                                Object.entries(themePresets) as [
                                    ThemeName,
                                    ThemePreset,
                                ][]
                            ).map(([themeKey, preset]) => (
                                <button
                                    key={themeKey}
                                    type="button"
                                    className={`theme-swatch ${theme === themeKey ? 'active' : ''}`}
                                    onClick={() => {
                                        onSelectTheme(themeKey)
                                        setIsThemePickerOpen(false)
                                    }}
                                    aria-label={`Select ${preset.label} theme`}
                                    title={preset.label}
                                >
                                    <span
                                        className="swatch-accent"
                                        style={{ background: preset.accent }}
                                    />
                                    <span
                                        className="swatch-accent-alt"
                                        style={{ background: preset.accentAlt }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {/* The live year — a hardcoded one quietly rots every January. */}
                <div className="pill">
                    Active term • {new Date().getFullYear()}
                </div>
                <TopbarAuth />
            </div>
        </header>
    )
}
