# Reaction Shooter

Reaction-time trainer for FPS players, built with React + TypeScript on the frontend and ASP.NET Core + PostgreSQL on the backend.

## Stack

- Frontend: React, TypeScript, Vite
- Backend: ASP.NET Core 8
- Data: PostgreSQL + Entity Framework Core
- Local infrastructure: Docker Compose

## Project structure

```text
ShooterProject/
├── frontend/     # React application
├── backend/      # ASP.NET Core API
└── docker-compose.yml
```

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://localhost:5000` by default. Copy `frontend/.env.example` to `frontend/.env` if you need to change it.

## Run backend + PostgreSQL

From the repository root:

```bash
docker compose up --build
```

API: `http://localhost:5000`

## API

- `GET /api/scores?limit=10` — top reaction times.
- `GET /api/scores/{id}` — retrieve one score.
- `POST /api/scores` — save a score.

Example request:

```json
{
  "player": "guest",
  "difficulty": 2,
  "timeMs": 243,
  "attempts": 1
}
```

## Frontend checks

```bash
npm run lint
npm run build
```
