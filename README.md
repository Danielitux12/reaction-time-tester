# Reaction Shooter (RTM)

Reaction-time trainer for FPS players, built with **React + TypeScript** on the frontend and **ASP.NET Core 8 (Clean Architecture) + PostgreSQL** on the backend.

---

## Tech Stack

* **Frontend:** React 19, TypeScript, Vite, Modern CSS
* **Backend:** .NET 8 (ASP.NET Core Web API), Entity Framework Core
* **Database:** PostgreSQL 15
* **Architecture:** Clean Architecture (Domain, Application, Infrastructure, Api, Web)
* **DevOps / Orchestration:** Docker & Docker Compose

---

## Project Structure

```text
reaction-time-tester/
├── frontend/                 # Client SPA (React + TypeScript + Vite)
├── backend/                  # .NET 8 Clean Architecture solution
│   ├── src/
│   │   ├── RTM.Domain/           # Pure domain entities and repository interfaces
│   │   ├── RTM.Application/      # Use cases, DTOs, and application services
│   │   ├── RTM.Infrastructure/   # PostgreSQL EF Core DbContext and repositories
│   │   ├── RTM.Api/              # REST API controllers and HTTP routing
│   │   └── RTM.Web/              # ASP.NET Core host (Program.cs, Swagger, CORS)
│   ├── Dockerfile            # Multi-stage production build for backend
│   └── RTM.sln               # Solution file
├── docker-compose.yml        # Orchestration for PostgreSQL and Backend API
└── README.md
```

### Backend Architecture (Clean Architecture)

```text
backend/
├── src/
│   ├── RTM.Domain/           # Enterprise domain entities and repository interfaces (Zero dependencies)
│   ├── RTM.Application/      # Business use cases, DTOs, and application services
│   ├── RTM.Infrastructure/   # PostgreSQL EF Core DbContext, entity configurations, repositories
│   ├── RTM.Api/              # REST API controllers and HTTP presentation
│   └── RTM.Web/              # ASP.NET Core Web Host, Program.cs, middleware, Swagger & health checks
└── RTM.sln
```

### Frontend Architecture

```text
frontend/src/
├── app/                      # Application root composition
├── components/               # Reusable UI components (profile, leaderboard)
├── config/                   # API URLs and difficulty configurations
├── controllers/              # Custom hooks coordinating UI state with use cases
├── features/                 # Feature-specific game logic (reaction-test)
├── services/                 # HTTP API integrations (scores)
└── shared/                   # Shared validation and storage utilities
```

---

## Running Locally

You can run the application using **Docker Compose (Recommended)** or **Natively (Without Docker)**.

### Option 1: Using Docker Compose (Recommended) 🐳

This method starts both **PostgreSQL** and the **.NET 8 Backend** automatically.

1. **Start Database and Backend:**
   ```bash
   docker compose up --build
   ```
   * **API URL:** `http://localhost:5000`
   * **Swagger UI:** `http://localhost:5000/swagger`
   * **Health Check:** `http://localhost:5000/health`

2. **Start Frontend (in a separate terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   * **Web App URL:** `http://localhost:5173`

---

### Option 2: Running Natively (Without Docker) 💻

#### Prerequisites:
* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* [Node.js](https://nodejs.org/) (v18+) & npm
* [PostgreSQL](https://www.postgresql.org/) running locally (default port: `5432`)

1. **Configure Connection String:**
   Ensure `backend/src/RTM.Web/appsettings.json` points to your local PostgreSQL instance:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Port=5432;Database=shooter;Username=postgres;Password=postgres"
   }
   ```
   *(Alternatively, export the environment variable `export CONNECTION_STRING="Host=localhost;..."`).*

2. **Run Backend:**
   ```bash
   cd backend
   dotnet restore RTM.sln
   dotnet run --project src/RTM.Web/RTM.Web.csproj
   ```

3. **Run Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## Environment Variables

### Frontend (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env` if you need to point to a custom API host:
```env
VITE_API_URL=http://localhost:5000
```

### Backend (`backend/src/RTM.Web/appsettings.json` or Environment)

* `CONNECTION_STRING`: PostgreSQL connection string (overrides `DefaultConnection`).
* `AllowedOrigins`: Array of frontend origins allowed by CORS policies (defaults to `["http://localhost:5173", "http://127.0.0.1:5173"]`).

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/scores?limit=10` | Top reaction times (ordered by lowest `timeMs`) |
| `GET` | `/api/scores/{id}` | Get score details by identifier |
| `POST` | `/api/scores` | Record a new score |
| `GET` | `/health` | Service health check |

### Sample POST Request Payload:
```json
{
  "player": "guest",
  "difficulty": 2,
  "timeMs": 243,
  "attempts": 1
}
```

---

## Quality Checks & Testing

### Frontend
```bash
cd frontend
npm run lint    # Run oxlint checks
npm run build   # Run TypeScript typecheck (tsc -b) & Vite bundle
```
