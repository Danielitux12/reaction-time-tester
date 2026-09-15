# ShooterBackend (ASP.NET Core)

Lightweight ASP.NET Core backend storing scores in PostgreSQL using Entity Framework Core.

Run locally:

1. Ensure you have .NET 8 SDK and PostgreSQL running.
2. Update `appsettings.json` or set environment variable `CONNECTION_STRING`.
3. Restore and run:

```bash
cd backend
dotnet restore
dotnet run --project ShooterBackend.csproj
```

Create DB migrations (optional):

```bash
dotnet tool install --global dotnet-ef
dotnet ef migrations add Initial -p ShooterBackend.csproj
dotnet ef database update -p ShooterBackend.csproj
```

API endpoints:
- `GET /api/scores?limit=10` — returns top scores (lowest time)
- `POST /api/scores` — body: `{ "player":"name","difficulty":2,"timeMs":500,"attempts":1 }`

Docker (recommended for local development):

```bash
# from repo root
docker compose up --build

# backend will be available at http://localhost:5000
```

The docker-compose file starts a Postgres instance and the backend; the backend uses the `CONNECTION_STRING` env var to connect to Postgres.
