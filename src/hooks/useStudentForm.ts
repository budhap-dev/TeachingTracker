import { useState } from 'react'
import type { Student } from '../data/students'

export type StudentFormValues = Omit<Student, 'id'>

export const emptyStudentForm: StudentFormValues = {
    studentId: '',
    firstName: '',
    lastName: '',
    dob: '',
    subjects: [],
    school: '',
    year: '',
    progress: 0,
    mode: 'Face to Face',
    notes: '',
    parentName: '',
    contactNumber: '',
    address: '',
}

/** Local state for the add-student form, including a reset to blank. */
export const useStudentForm = () => {
    const [form, setForm] = useState<StudentFormValues>(emptyStudentForm)

    const setField = (
        field: keyof StudentFormValues,
        value: string | number | string[]
    ) => {
        setForm((current) => ({ ...current, [field]: value }))
    }

    const resetForm = () => setForm(emptyStudentForm)

    return { form, setField, resetForm }
}
