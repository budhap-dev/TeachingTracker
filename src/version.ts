import packageJson from '../package.json'

/**
 * The version shown in the sidebar footer. On every deploy CI injects
 * `VITE_APP_VERSION` as `<major>.<minor>.<run-number>`, so it ticks up each time
 * a build ships. Local builds (no injected value) fall back to package.json.
 */
export const appVersion =
    import.meta.env.VITE_APP_VERSION || packageJson.version

/**
 * Which environment this build targets. CI injects `VITE_APP_ENV`
 * (dev/prod); anything that is not explicitly prod — dev builds, local
 * `npm run dev` — counts as non-prod, and the brand badge wears a yellow
 * ring so the two apps can never be mistaken for each other.
 */
export const isProdBuild = import.meta.env.VITE_APP_ENV === 'prod'
