# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files first for efficient layer caching
COPY ShooterBackend.sln ./
COPY Domain/ShooterBackend.Domain.csproj Domain/
COPY Application/ShooterBackend.Application.csproj Application/
COPY Infrastructure/ShooterBackend.Infrastructure.csproj Infrastructure/
COPY Api/ShooterBackend.Api.csproj Api/
COPY Web/ShooterBackend.Web.csproj Web/

RUN dotnet restore ShooterBackend.sln

# Copy all source files
COPY Domain/ Domain/
COPY Application/ Application/
COPY Infrastructure/ Infrastructure/
COPY Api/ Api/
COPY Web/ Web/

# Publish Web host project
RUN dotnet publish Web/ShooterBackend.Web.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

ENTRYPOINT ["dotnet", "ShooterBackend.Web.dll"]
