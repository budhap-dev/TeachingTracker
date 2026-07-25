import { useCallback, useState } from 'react'
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
    fees: 0,
    feeType: 'per-session',
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

    /** Seeds several fields at once — converting a lead pre-fills the form
     *  from the enquiry (REQ-019) instead of retyping it. */
    const prefill = useCallback(
        (values: Partial<StudentFormValues>) =>
            setForm((current) => ({ ...current, ...values })),
        []
    )

    return { form, setField, resetForm, prefill }
}
