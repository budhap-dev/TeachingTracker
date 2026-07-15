import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchStudent, fetchStudents, upsertStudent } from './students'
import type { StudentInput } from './students'

const jsonResponse = (body: unknown) =>
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body })

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

const sampleInput: StudentInput = {
    studentId: 'STU-TEST01',
    firstName: 'Jo',
    lastName: 'Bloggs',
    dob: '2011-01-01',
    subjects: ['Mathematics'],
    school: 'Test School',
    year: '10',
    progress: 50,
    mode: 'Online',
    notes: '',
    parentName: 'Parent',
    contactNumber: '0700',
    address: 'Somewhere',
}

describe('students api', () => {
    it('fetches all students from /students', async () => {
        const fetchMock = jsonResponse([{ id: 1 }])
        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchStudents()).resolves.toEqual([{ id: 1 }])
        expect(fetchMock).toHaveBeenCalledWith(
            '/students',
            expect.objectContaining({ method: 'GET' })
        )
    })

    it('fetches a single student from /students/{id}', async () => {
        const fetchMock = jsonResponse({ id: 3 })
        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchStudent(3)).resolves.toEqual({ id: 3 })
        expect(fetchMock).toHaveBeenCalledWith(
            '/students/3',
            expect.objectContaining({ method: 'GET' })
        )
    })

    it('upserts a student via POST /students', async () => {
        const fetchMock = jsonResponse({ id: 9, ...sampleInput })
        vi.stubGlobal('fetch', fetchMock)

        await expect(upsertStudent(sampleInput)).resolves.toMatchObject({
            id: 9,
        })
        expect(fetchMock).toHaveBeenCalledWith(
            '/students',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(sampleInput),
            })
        )
    })
})
