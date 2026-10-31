# Nursery Management System

A full-stack web application for managing nursery operations, including stock, plant health, staff activities, daily care, expenses, and sales.

This repository contains:
- `nursery-backend`: Node.js + Express + TypeScript API with PostgreSQL
- `nursery-frontend`: Next.js + Tailwind CSS user interface

## Overview

The system helps nursery teams handle:
- Species and batch tracking
- Watering schedules and overdue checks
- Plant observations and health monitoring
- Issue detection and treatment planning
- Customer and sales records
- Expense tracking
- Staff management

## Tech Stack

Backend
- Node.js
- TypeScript
- Express.js
- PostgreSQL
- JWT, bcrypt, Zod, CORS

Frontend
- Next.js 14
- React 18
- Tailwind CSS

## Project Structure

```text
nursery-management-system/
├── README.md
├── nursery-backend/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── .gitignore
└── nursery-frontend/
    ├── app/
    ├── components/
    ├── lib/
    ├── package.json
    └── README.md
```

## Backend Features

The backend exposes REST APIs for:
- species management
- batch management
- watering logs
- observations
- issues and treatments
- customers
- sales and sale items
- expenses
- staff

Main server entry:
- `nursery-backend/src/server.ts`

Health check endpoint:
- `GET /api/health`

## Frontend Features

The frontend includes screens for:
- watering
- health checks
- treatments
- expenses
- role-based access for staff, manager, and owner

## Prerequisites

Before running the project, make sure you have:
- Node.js (LTS recommended)
- npm
- PostgreSQL database server

## Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd nursery-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in `nursery-backend` with your PostgreSQL settings:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=nursery_db
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Production build:
   ```bash
   npm run build
   npm start
   ```

The backend runs on:
- http://localhost:5000

## Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd nursery-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the app:
   ```bash
   npm run dev
   ```

4. Open the app in a browser at:
   - http://localhost:3000

If no backend URL is configured, the frontend can use demo/sample data. To connect to the real API, configure the environment variable in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Environment Notes

- Backend uses PostgreSQL connection values from the `.env` file.
- Frontend may use a public API URL value if connected to the live backend.
- The app is structured for local development and can be extended for deployment.

## Default Scripts

Backend:
- `npm run dev` — run in development mode with tsx watch
- `npm run build` — build TypeScript project
- `npm start` — run compiled server

Frontend:
- `npm run dev` — run Next.js development server
- `npm run build` — create production build
- `npm start` — run production server

## Contributing

Feel free to fork the repository, create a feature branch, and submit a pull request with your improvements.

## License

This project currently uses the ISC license in the backend package configuration.

## Notes

This repository is organized as a multi-application system and is suitable for managing a nursery business with operational, health, and financial workflows.
