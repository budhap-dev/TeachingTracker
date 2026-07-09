import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import type { FormEvent } from 'react';
import type { Student } from '../data/students';

const subjectOptions = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
const yearOptions = Array.from({ length: 8 }, (_, index) => String(index + 6));

type StudentFormModalProps = {
  open: boolean;
  form: Omit<Student, 'id'>;
  onClose: () => void;
  onChange: (field: keyof Omit<Student, 'id'>, value: string | number) => void;
  onSubmit: (event: FormEvent) => void;
};

export const StudentFormModal = ({ open, form, onClose, onChange, onSubmit }: StudentFormModalProps) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>Add a new student</DialogTitle>
    <DialogContent>
      <Box component="form" onSubmit={onSubmit} className="student-form modal-form">
        <TextField label="First Name" value={form.firstName} onChange={(event) => onChange('firstName', event.target.value)} fullWidth />
        <TextField label="Last Name" value={form.lastName} onChange={(event) => onChange('lastName', event.target.value)} fullWidth />
        <TextField label="Date of Birth" type="date" value={form.dob} onChange={(event) => onChange('dob', event.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        <FormControl fullWidth>
          <InputLabel id="subject-label">Subject</InputLabel>
          <Select labelId="subject-label" label="Subject" value={form.subject} onChange={(event) => onChange('subject', event.target.value)}>
            {subjectOptions.map((subject) => (
              <MenuItem key={subject} value={subject}>{subject}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField label="School" value={form.school} onChange={(event) => onChange('school', event.target.value)} fullWidth />
        <FormControl fullWidth>
          <InputLabel id="year-label">Year</InputLabel>
          <Select labelId="year-label" label="Year" value={form.year} onChange={(event) => onChange('year', event.target.value)}>
            {yearOptions.map((year) => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField label="Progress %" type="number" value={form.progress} onChange={(event) => onChange('progress', Number(event.target.value))} fullWidth />
        <FormControl fullWidth>
          <InputLabel id="mode-label">Mode</InputLabel>
          <Select labelId="mode-label" label="Mode" value={form.mode} onChange={(event) => onChange('mode', event.target.value)}>
            <MenuItem value="Online">Online</MenuItem>
            <MenuItem value="Face to Face">Face to Face</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Parent Name" value={form.parentName} onChange={(event) => onChange('parentName', event.target.value)} fullWidth />
        <TextField label="Contact Number" value={form.contactNumber} onChange={(event) => onChange('contactNumber', event.target.value)} fullWidth />
        <TextField label="Address" multiline minRows={2} value={form.address} onChange={(event) => onChange('address', event.target.value)} fullWidth />
        <TextField label="Notes" multiline minRows={3} value={form.notes} onChange={(event) => onChange('notes', event.target.value)} fullWidth />
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Save student</Button>
        </DialogActions>
      </Box>
    </DialogContent>
  </Dialog>
);
