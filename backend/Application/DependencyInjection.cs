using Microsoft.Extensions.DependencyInjection;
using ShooterBackend.Application.Interfaces;
using ShooterBackend.Application.Services;

namespace ShooterBackend.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IScoreService, ScoreService>();
        return services;
    }
}
