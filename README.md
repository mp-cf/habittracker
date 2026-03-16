# Monthly Habit Tracker

A simple web app for tracking monthly habits using Next.js. Add habits and check off days in a grid view. Data is stored locally in JSON files, with an API designed for easy PostgreSQL integration.

## Features

- Add and delete habits
- Monthly grid view with checkboxes for each day
- Navigate between months
- Local storage (JSON files) with REST API
- Ready for PostgreSQL migration

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Deployment (recommended for server)

### Build & run

```bash
docker build -t habittracker .
docker run -p 3000:3000 -e APP_PASSWORD=letmein habittracker
```

### Run with PostgreSQL (docker-compose)

```bash
docker compose up -d
```

Then visit [http://localhost:3000](http://localhost:3000).

Default password is `letmein` (can be changed via `APP_PASSWORD` env).

## API Endpoints

- `GET/POST /api/habits` - Manage habits
- `GET/POST /api/months` - Manage months
- `GET/POST /api/checks` - Manage checks
- `PATCH /api/checks/[id]` - Update check
- `DELETE /api/habits/[id]` - Delete habit

## PostgreSQL Migration

To switch to PostgreSQL:
1. Install `pg` and update API routes to use database queries.
2. Set `DATABASE_URL` environment variable.
3. Run migration scripts to create tables.

## Built With

- Next.js
- TypeScript
- Tailwind CSS
