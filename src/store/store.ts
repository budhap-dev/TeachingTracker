import { configureStore, createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialStudents, Student } from '../data/students';
import { createStudent, fetchStudents, updateStudentProgress } from '../api/studentApi';

type StudentDetailField = keyof Pick<Student, 'parentName' | 'contactNumber' | 'address' | 'notes'>;

type StudentState = {
  students: Student[];
  loading: boolean;
};

const initialState: StudentState = {
  students: initialStudents,
  loading: false,
};

export const loadStudents = createAsyncThunk('students/loadStudents', async () => {
  try {
    return await fetchStudents();
  } catch {
    return initialStudents;
  }
});

export const saveStudent = createAsyncThunk('students/saveStudent', async (student: Omit<Student, 'id'>) => {
  try {
    return await createStudent(student);
  } catch {
    return { id: Date.now(), ...student } as Student;
  }
});

export const updateStudent = createAsyncThunk('students/updateStudent', async ({ id, progress }: { id: number; progress: number }) => {
  try {
    return await updateStudentProgress(id, progress);
  } catch {
    return { id, progress } as Student;
  }
});

const studentSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    addStudent: (state, action: PayloadAction<Omit<Student, 'id'>>) => {
      const generatedStudentId = `STU-${Date.now().toString().slice(-6)}`;
      state.students.push({
        id: Date.now(),
        ...action.payload,
        studentId: action.payload.studentId || generatedStudentId,
      });
    },
    updateProgress: (state, action: PayloadAction<{ id: number; progress: number }>) => {
      const student = state.students.find((item) => item.id === action.payload.id);
      if (student) {
        student.progress = action.payload.progress;
      }
    },
    updateStudentDetails: (state, action: PayloadAction<{ id: number; field: StudentDetailField; value: string }>) => {
      const student = state.students.find((item) => item.id === action.payload.id);
      if (student) {
        student[action.payload.field] = action.payload.value as never;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadStudents.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadStudents.fulfilled, (state, action) => {
      state.students = action.payload;
      state.loading = false;
    });
    builder.addCase(loadStudents.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(saveStudent.fulfilled, (state, action) => {
      state.students.push(action.payload);
    });
    builder.addCase(updateStudent.fulfilled, (state, action) => {
      const student = state.students.find((item) => item.id === action.payload.id);
      if (student) {
        student.progress = action.payload.progress;
      }
    });
  },
});

export const { addStudent, updateProgress, updateStudentDetails } = studentSlice.actions;

export const store = configureStore({
  reducer: {
    students: studentSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
