import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Student } from '../data/students'
import { initialStudents } from '../data/students'
import {
    addStudent,
    loadStudents,
    store,
    resetStudentState,
    updatePaymentRecord,
    updateProgress,
    updateStudentDetails,
} from './store'

const buildStudentPayload = (
    overrides: Partial<Omit<Student, 'id'>> = {}
): Omit<Student, 'id'> => ({
    studentId: overrides.studentId ?? '',
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'Student',
    dob: overrides.dob ?? '2010-01-01',
    subjects: overrides.subjects ?? ['Mathematics'],
    school: overrides.school ?? 'Test School',
    year: overrides.year ?? '10',
    progress: overrides.progress ?? 60,
    mode: overrides.mode ?? 'Online',
    notes: overrides.notes ?? 'Note',
    parentName: overrides.parentName ?? 'Parent Name',
    contactNumber: overrides.contactNumber ?? '0700000000',
    address: overrides.address ?? 'Test Address',
})

describe('store reducers and thunks', () => {
    beforeEach(() => {
        store.dispatch(resetStudentState())
    })

    afterEach(() => {
        vi.unstubAllEnvs()
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('loads students from the API when a backend is configured', async () => {
        const apiStudents = [
            { ...initialStudents[0], firstName: 'FromApi', id: 4242 },
        ]
        vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api')
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => apiStudents,
            })
        )

        await store.dispatch(loadStudents())

        expect(
            store
                .getState()
                .students.students.find((student) => student.id === 4242)
                ?.firstName
        ).toBe('FromApi')
    })

    it('covers reducer actions and extra reducers', () => {
        const beforeCount = store.getState().students.students.length

        store.dispatch(addStudent(buildStudentPayload({ studentId: '' })))
        const generatedStudent = store.getState().students.students.at(-1)
        expect(generatedStudent?.studentId).toMatch(/^STU-/)

        store.dispatch(
            addStudent(buildStudentPayload({ studentId: 'STU-EXPLICIT' }))
        )
        expect(store.getState().students.students.at(-1)?.studentId).toBe(
            'STU-EXPLICIT'
        )
        expect(store.getState().students.students.length).toBe(beforeCount + 2)

        const existingId = store.getState().students.students[0].id
        const oldProgress = store.getState().students.students[0].progress

        store.dispatch(
            updateProgress({ id: existingId, progress: oldProgress + 5 })
        )
        expect(store.getState().students.students[0].progress).toBe(
            oldProgress + 5
        )

        store.dispatch(updateProgress({ id: -999, progress: 42 }))
        expect(store.getState().students.students[0].progress).toBe(
            oldProgress + 5
        )

        store.dispatch(
            updateStudentDetails({
                id: existingId,
                field: 'notes',
                value: 'Updated Notes',
            })
        )
        expect(store.getState().students.students[0].notes).toBe(
            'Updated Notes'
        )

        store.dispatch(
            updateStudentDetails({ id: -999, field: 'notes', value: 'Nope' })
        )
        expect(store.getState().students.students[0].notes).toBe(
            'Updated Notes'
        )

        store.dispatch(
            updatePaymentRecord({
                studentId: -999,
                month: '2099-01',
                status: 'Paid',
                amountPaid: 120,
                notes: 'Missing',
            })
        )
        expect(
            store
                .getState()
                .students.paymentRecords.some(
                    (record) => record.studentId === -999
                )
        ).toBe(false)

        store.dispatch(loadStudents.pending('req-1', undefined))
        expect(store.getState().students.loading).toBe(true)

        store.dispatch(
            loadStudents.rejected(
                new Error('fail') as Error | null,
                'req-1',
                undefined
            )
        )
        expect(store.getState().students.loading).toBe(false)
    })

    it('covers the load thunk and add/update reducer flows', async () => {
        await store.dispatch(loadStudents())
        expect(store.getState().students.students).toEqual(initialStudents)

        store.dispatch(
            addStudent(
                buildStudentPayload({
                    studentId: 'STU-120000',
                    firstName: 'Saved',
                })
            )
        )
        const savedStudent = store
            .getState()
            .students.students.find((student) => student.firstName === 'Saved')

        expect(savedStudent).toBeDefined()

        store.dispatch(updateProgress({ id: savedStudent!.id, progress: 99 }))
        expect(
            store
                .getState()
                .students.students.find(
                    (student) => student.id === savedStudent!.id
                )?.progress
        ).toBe(99)

        store.dispatch(updateProgress({ id: -12345, progress: 55 }))
        expect(
            store
                .getState()
                .students.students.find((student) => student.id === -12345)
        ).toBeUndefined()
    })

    it('merges local edits when fresh students load', () => {
        store.dispatch(
            addStudent(
                buildStudentPayload({
                    studentId: 'STU-LOCAL',
                    firstName: 'Local',
                    lastName: 'Student',
                })
            )
        )

        const existingStudent = {
            ...initialStudents[0],
            firstName: 'Updated Asha',
        }
        const remoteStudent = {
            ...buildStudentPayload({
                studentId: 'STU-REMOTE',
                firstName: 'Remote',
                lastName: 'Student',
            }),
            id: 9999,
        }

        store.dispatch(
            loadStudents.fulfilled(
                [existingStudent, remoteStudent],
                'req-merge',
                undefined
            )
        )

        expect(
            store
                .getState()
                .students.students.find((student) => student.id === 1)
                ?.firstName
        ).toBe('Updated Asha')
        expect(
            store
                .getState()
                .students.students.find((student) => student.id === 9999)
        ).toBeDefined()
    })
})
