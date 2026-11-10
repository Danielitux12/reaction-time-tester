# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files first for efficient layer caching
COPY RTM.sln ./
COPY src/RTM.Domain/RTM.Domain.csproj src/RTM.Domain/
COPY src/RTM.Application/RTM.Application.csproj src/RTM.Application/
COPY src/RTM.Infrastructure/RTM.Infrastructure.csproj src/RTM.Infrastructure/
COPY src/RTM.Api/RTM.Api.csproj src/RTM.Api/
COPY src/RTM.Web/RTM.Web.csproj src/RTM.Web/

RUN dotnet restore RTM.sln

# Copy all source files
COPY src/ src/

# Publish Web host project
RUN dotnet publish src/RTM.Web/RTM.Web.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

ENTRYPOINT ["dotnet", "RTM.Web.dll"]
