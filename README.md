# Teaching Tracker

Teaching Tracker is a responsive React + TypeScript application for managing student records, progress, attendance, and payments.

## Features

- Dashboard overview
- Student management view
- Add new students
- Update student progress
- Payment status tracking
- Responsive layout for desktop and mobile
- Redux-based state management
- Sass styling

## Tech Stack

- React
- TypeScript
- Vite
- Redux Toolkit
- Sass

## Project Structure

- src/ - frontend React application
    - components/ - UI components (if added later)
    - data/ - student seed data
    - store/ - Redux store and thunks

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Run the frontend locally

```bash
npm run dev
```

Then open http://localhost:3000.

### Build the frontend

```bash
npm run build
```

## Notes

The app uses local Redux state and seed data.

## Roadmap

- Add authentication for teachers
- Add analytics charts
- Support multiple teachers
- Add persistent student detail pages
