import { describe, expect, it } from 'vitest'
import type { Attachment } from '../data/attachments'
import { groupCopies } from './classFiles'

const row = (id: number, fileName: string, sizeBytes: number) =>
    ({ id, fileName, sizeBytes }) as Attachment

describe('groupCopies', () => {
    it("folds a group class's copies into one file, keeping order", () => {
        const groups = groupCopies([
            row(1, 'board.jpg', 100),
            row(2, 'paper.pdf', 50),
            row(3, 'board.jpg', 100),
            row(4, 'board.jpg', 101),
        ])
        expect(groups.map((g) => [g.file.id, g.copies.map((c) => c.id)])).toEqual([
            [1, [1, 3]],
            [2, [2]],
            [4, [4]],
        ])
    })
})
