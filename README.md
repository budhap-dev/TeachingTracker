# Teaching Tracker

Teaching Tracker is a responsive React + TypeScript application for managing student records, progress, attendance, and payments. It is designed for a single teacher initially and can later be extended with more teachers and a backend API.

## Features

- Dashboard overview
- Student management view
- Add new students
- Update student progress
- Payment status tracking
- Responsive layout for desktop and mobile
- Redux-based state management
- Sass styling
- Azure Functions backend setup for future Cosmos DB integration

## Tech Stack

- React
- TypeScript
- Vite
- Redux Toolkit
- Sass
- Azure Functions
- Cosmos DB (planned integration)

## Project Structure

- src/ - frontend React application
    - components/ - UI components (if added later)
    - data/ - student seed data
    - store/ - Redux store and thunks
    - api/ - API integration layer
- azure-functions/ - Azure Functions backend scaffold

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Azure Functions Core Tools (optional, for backend development)

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

## Azure Functions Backend

The project includes a basic Azure Functions backend under the azure-functions folder.

### Start the functions locally

```bash
cd azure-functions
npm install
func start
```

### Cosmos DB setup

Rename local.settings.sample.json to local.settings.json and add your Cosmos DB connection details:

- COSMOS_ENDPOINT
- COSMOS_KEY
- COSMOS_DATABASE
- COSMOS_CONTAINER

## Notes

The current frontend can run without the backend, and the app uses fallback data if the API is unavailable.

## Roadmap

- Connect frontend to real Cosmos DB-backed API
- Add authentication for teachers
- Add analytics charts
- Support multiple teachers
- Add persistent student detail pages
