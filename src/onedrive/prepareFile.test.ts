import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FileRefusedError, prepareFile } from './prepareFile'

const MB = 1024 * 1024
const fileOf = (name: string, type: string, size = 10) =>
    new File([new Uint8Array(size)], name, { type })

let drawn: { width: number; height: number } | null = null
let encodedSize = 1000

beforeEach(() => {
    drawn = null
    encodedSize = 1000
    vi.stubGlobal(
        'createImageBitmap',
        vi.fn().mockResolvedValue({ width: 4000, height: 3000, close: vi.fn() })
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        function (this: HTMLCanvasElement) {
            return {
                drawImage: () => {
                    drawn = { width: this.width, height: this.height }
                },
            } as unknown as CanvasRenderingContext2D
        } as never
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
        (callback, type) =>
            callback(
                new Blob([new Uint8Array(encodedSize)], { type: type ?? '' })
            )
    )
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('prepareFile — photos', () => {
    it('shrinks to 2000px on the long edge and re-encodes as JPEG', async () => {
        const prepared = await prepareFile(fileOf('IMG_0042.HEIC', '', 6 * MB))
        expect(drawn).toEqual({ width: 2000, height: 1500 })
        expect(prepared).toMatchObject({
            fileName: 'IMG_0042.jpg',
            contentType: 'image/jpeg',
        })
        expect(prepared.blob.type).toBe('image/jpeg')
        expect(prepared.blob.size).toBe(1000)
    })

    it('never enlarges a small photo', async () => {
        vi.mocked(createImageBitmap).mockResolvedValue({
            width: 800,
            height: 600,
            close: vi.fn(),
        } as unknown as ImageBitmap)
        await prepareFile(fileOf('small.png', 'image/png'))
        expect(drawn).toEqual({ width: 800, height: 600 })
    })

    it('measures a photo after shrinking, not before', async () => {
        // 30MB raw, small once re-encoded: accepted.
        await expect(
            prepareFile(fileOf('big.jpg', 'image/jpeg', 30 * MB))
        ).resolves.toBeTruthy()
    })

    it('refuses a photo still over 20MB after shrinking', async () => {
        encodedSize = 21 * MB
        await expect(
            prepareFile(fileOf('huge.jpg', 'image/jpeg'))
        ).rejects.toThrow(/21\.0 MB — the limit is 20 MB/)
    })

    it('refuses a photo the browser cannot read, with a way forward', async () => {
        vi.mocked(createImageBitmap).mockRejectedValue(new Error('decode'))
        const error = await prepareFile(fileOf('odd.heic', 'image/heic')).catch(
            (e) => e
        )
        expect(error).toBeInstanceOf(FileRefusedError)
        expect(error.message).toMatch(/could not be read/)
        expect(error.fileName).toBe('odd.heic')
    })

    it('refuses when there is no canvas to draw on', async () => {
        vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null)
        await expect(
            prepareFile(fileOf('a.jpg', 'image/jpeg'))
        ).rejects.toBeInstanceOf(FileRefusedError)
    })

    it('refuses when the canvas cannot encode', async () => {
        vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation(
            (callback) => callback(null)
        )
        await expect(
            prepareFile(fileOf('a.jpg', 'image/jpeg'))
        ).rejects.toBeInstanceOf(FileRefusedError)
    })
})

describe('prepareFile — documents', () => {
    it('passes a PDF through untouched', async () => {
        const file = fileOf('scan.pdf', 'application/pdf')
        expect(await prepareFile(file)).toEqual({
            blob: file,
            fileName: 'scan.pdf',
            contentType: 'application/pdf',
        })
    })

    it('knows a Word file by its extension when the type is empty', async () => {
        const prepared = await prepareFile(fileOf('Past paper.docx', ''))
        expect(prepared.contentType).toMatch(/wordprocessingml/)
    })

    it('refuses other types before anything uploads', async () => {
        await expect(
            prepareFile(fileOf('notes.zip', 'application/zip'))
        ).rejects.toThrow(/Only photos, PDFs, and Word or PowerPoint/)
    })

    it('refuses a document over 20MB', async () => {
        await expect(
            prepareFile(fileOf('deck.pptx', '', 20 * MB + 1))
        ).rejects.toThrow(/the limit is 20 MB/)
    })
})
