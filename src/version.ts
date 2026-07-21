import packageJson from '../package.json'

/**
 * The version shown in the sidebar footer. On every deploy CI injects
 * `VITE_APP_VERSION` as `<major>.<minor>.<run-number>`, so it ticks up each time
 * a build ships. Local builds (no injected value) fall back to package.json.
 */
export const appVersion =
    import.meta.env.VITE_APP_VERSION || packageJson.version
