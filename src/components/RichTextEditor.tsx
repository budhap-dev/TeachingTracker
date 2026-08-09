import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { IconButton } from '@mui/material'
import FormatBoldRoundedIcon from '@mui/icons-material/FormatBoldRounded'
import FormatItalicRoundedIcon from '@mui/icons-material/FormatItalicRounded'
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded'
import FormatListNumberedRoundedIcon from '@mui/icons-material/FormatListNumberedRounded'

/** tiptap-markdown extends editor.storage without augmenting the type. */
const markdownOf = (editor: Editor): string =>
    (
        editor.storage as unknown as {
            markdown: { getMarkdown: () => string }
        }
    ).markdown.getMarkdown()

type RichTextEditorProps = {
    /** Markdown in, Markdown out — the document stores Markdown and the
        API strips raw HTML, so the editor is a view over the same value
        the textarea used to hold. */
    value: string
    onChange: (markdown: string) => void
    ariaLabel: string
}

/**
 * A small rich-text surface for the About intro (owner ask, 2026-08-09):
 * bold, italics and lists — the vocabulary the site's Markdown renderer
 * actually supports — editing what is stored as Markdown either way.
 */
export const RichTextEditor = ({
    value,
    onChange,
    ariaLabel,
}: RichTextEditorProps) => {
    const editor = useEditor({
        extensions: [StarterKit, Markdown],
        content: value,
        editorProps: {
            attributes: {
                class: 'rich-text-surface',
                'aria-label': ariaLabel,
                role: 'textbox',
            },
        },
        onUpdate: ({ editor: current }) => {
            onChange(markdownOf(current))
        },
    })

    // Adopt outside changes (Load the prepared content, refreshed fetch)
    // without fighting the user's own typing.
    useEffect(() => {
        if (!editor || editor.isFocused) {
            return
        }
        if (markdownOf(editor) !== value) {
            editor.commands.setContent(value)
        }
    }, [editor, value])

    if (!editor) {
        return null
    }

    return (
        <div className="rich-text-editor">
            <div className="rich-text-toolbar" role="toolbar">
                <IconButton
                    size="small"
                    onMouseDown={(event) => event.preventDefault()}
                    aria-label="Bold"
                    className={editor.isActive('bold') ? 'on' : ''}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <FormatBoldRoundedIcon fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    onMouseDown={(event) => event.preventDefault()}
                    aria-label="Italic"
                    className={editor.isActive('italic') ? 'on' : ''}
                    onClick={() =>
                        editor.chain().focus().toggleItalic().run()
                    }
                >
                    <FormatItalicRoundedIcon fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    onMouseDown={(event) => event.preventDefault()}
                    aria-label="Bullet list"
                    className={editor.isActive('bulletList') ? 'on' : ''}
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                >
                    <FormatListBulletedRoundedIcon fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    onMouseDown={(event) => event.preventDefault()}
                    aria-label="Numbered list"
                    className={editor.isActive('orderedList') ? 'on' : ''}
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                >
                    <FormatListNumberedRoundedIcon fontSize="small" />
                </IconButton>
            </div>
            <EditorContent editor={editor} />
        </div>
    )
}
