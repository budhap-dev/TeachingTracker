import { lazy, Suspense, type ComponentProps, type JSX } from 'react'
import type CropperClass from 'react-easy-crop'

/**
 * The About page's editing tools, loaded only when the teacher edits.
 *
 * The rich-text editor (TipTap, ProseMirror, markdown-it) and the photo
 * cropper were ~530 KB of the code every visitor downloaded before the first
 * screen showed — about 60% of the vendor bundle — for features only the
 * teacher uses, and only while editing. Split out, they arrive on first use.
 */
const RichTextEditorModule = lazy(() =>
    import('./RichTextEditor').then((module) => ({
        default: module.RichTextEditor,
    }))
)
const CropperModule = lazy(() => import('react-easy-crop'))

const Loading = () => (
    <p className="lazy-editor-loading" role="status">
        Loading editor…
    </p>
)

export const RichTextEditor = (
    props: ComponentProps<typeof RichTextEditorModule>
) => (
    <Suspense fallback={<Loading />}>
        <RichTextEditorModule {...props} />
    </Suspense>
)

/** The cropper's props as JSX sees them: its defaults make most optional. */
type CropperProps = JSX.LibraryManagedAttributes<
    typeof CropperClass,
    ComponentProps<typeof CropperClass>
>

export const Cropper = (props: CropperProps) => (
    <Suspense fallback={<Loading />}>
        <CropperModule {...props} />
    </Suspense>
)
