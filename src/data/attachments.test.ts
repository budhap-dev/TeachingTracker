import { describe, expect, it } from 'vitest'
import { contentTypeOf, formatBytes, isImageFile } from './attachments'

const DOCX =
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

describe('contentTypeOf', () => {
    it.each([
        [{ name: 'a.pdf', type: 'application/pdf' }, 'application/pdf'],
        [{ name: 'a.jpg', type: 'image/jpeg' }, 'image/jpeg'],
        // Some browsers leave the type empty for Office files.
        [{ name: 'Past Paper.DOCX', type: '' }, DOCX],
        [{ name: 'deck.pptx', type: '' }, expect.stringContaining('presentationml')],
        [{ name: 'notes.doc', type: 'application/msword' }, null],
        [{ name: 'archive.zip', type: 'application/zip' }, null],
        [{ name: 'noextension', type: '' }, null],
    ])('%o → %s', (file, expected) => {
        expect(contentTypeOf(file)).toEqual(expected)
    })
})

describe('isImageFile', () => {
    it('knows images by type, and HEIC by name when the type is empty', () => {
        expect(isImageFile({ name: 'a.png', type: 'image/png' })).toBe(true)
        expect(isImageFile({ name: 'IMG_1.HEIC', type: '' })).toBe(true)
        expect(isImageFile({ name: 'a.pdf', type: 'application/pdf' })).toBe(false)
    })
})

describe('formatBytes', () => {
    it('reads in KB below a megabyte and MB above', () => {
        expect(formatBytes(100)).toBe('1 KB')
        expect(formatBytes(820 * 1024)).toBe('820 KB')
        expect(formatBytes(1.45 * 1024 * 1024)).toBe('1.4 MB')
    })
})
