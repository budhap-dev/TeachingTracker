import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    { ignores: ['dist', 'node_modules'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        // The service worker runs in its own global scope (REQ-044): `self`,
        // `caches`, `Request` and friends are undefined under the browser
        // globals the app uses.
        files: ['public/sw.js'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.serviceworker,
        },
    },
    {
        // The API wake-up script (first-load work, 2026-11-12): plain
        // browser JavaScript, loaded from the page's HTML before the app.
        files: ['public/warm-api.js'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
    },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
        },
    }
)
