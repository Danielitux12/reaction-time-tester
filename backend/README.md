# ShooterBackend (.NET 8 Clean Architecture)

Lightweight ASP.NET Core backend storing scores in PostgreSQL using Entity Framework Core, structured according to Clean Architecture principles.

## Architecture

The project is split into 5 distinct layers:

```text
backend/
├── Domain/           # Enterprise domain entities and repository contracts (pure C#, no dependencies)
├── Application/      # Use cases, DTOs, service interfaces, validation, and domain orchestration
├── Infrastructure/   # PostgreSQL AppDbContext, EF Core entity mappings, and repository implementations
├── Api/              # ASP.NET Core API controllers, routing, and HTTP contracts
├── Web/              # Web application entry point (Program.cs), middleware, Swagger, CORS, and hosting
└── ShooterBackend.sln
```

### Layer Responsibilities

1. **Domain (`ShooterBackend.Domain`)**:
   - Contains core entities (`Score`) and repository contracts (`IScoreRepository`).
   - Zero external framework dependencies.

2. **Application (`ShooterBackend.Application`)**:
   - Defines DTOs (`ScoreRequest`, `ScoreResponse`), application interfaces (`IScoreService`), and business logic orchestration (`ScoreService`).
   - Handles input normalization (e.g. trimming and default player names) and limit clamping.

3. **Infrastructure (`ShooterBackend.Infrastructure`)**:
   - EF Core `AppDbContext` and entity configurations (`ScoreConfiguration`).
   - Implementation of `IScoreRepository` (`ScoreRepository`).
   - Database initialization with resilient retry policy (`DatabaseInitializer`).

4. **Api (`ShooterBackend.Api`)**:
   - REST API Controllers (`ScoresController`).
   - Maps HTTP requests, response status codes, and delegates directly to `IScoreService`.

5. **Web (`ShooterBackend.Web`)**:
   - Composition root and executable entry point (`Program.cs`).
   - Dependency Injection composition (`AddApplication`, `AddInfrastructure`, `AddApi`).
   - Swagger / OpenAPI documentation UI at `/swagger`.
   - Health check endpoint at `/health`.
   - CORS policy configuration and PostgreSQL startup retry execution.

## Run Locally

1. Ensure you have the .NET 8 SDK and PostgreSQL running.
2. Update `Web/appsettings.json` or set the environment variable `CONNECTION_STRING`.
3. Restore and run:

```bash
cd backend
dotnet restore ShooterBackend.sln
dotnet run --project Web/ShooterBackend.Web.csproj
```

Swagger UI will be accessible at: `http://localhost:5000/swagger` (or the configured port).

## API Endpoints

- `GET /api/scores?limit=10` — returns top scores (lowest reaction time first)
- `GET /api/scores/{id}` — returns score details by ID
- `POST /api/scores` — body: `{ "player": "name", "difficulty": 2, "timeMs": 500, "attempts": 1 }`
- `GET /health` — health check endpoint

## Docker (Recommended)

From repo root:

```bash
docker compose up --build
```

The backend is exposed at `http://localhost:5000` and Swagger UI is at `http://localhost:5000/swagger`.
