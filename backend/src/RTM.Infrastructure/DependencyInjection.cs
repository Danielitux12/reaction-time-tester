using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RTM.Domain.Interfaces;
using RTM.Infrastructure.Persistence;
using RTM.Infrastructure.Repositories;

namespace RTM.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = Environment.GetEnvironmentVariable("CONNECTION_STRING")
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("A PostgreSQL connection string is required.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IScoreRepository, ScoreRepository>();
        services.AddScoped<IDatabaseInitializer, DatabaseInitializer>();

        return services;
    }
}
