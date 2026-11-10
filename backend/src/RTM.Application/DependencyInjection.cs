using Microsoft.Extensions.DependencyInjection;
using RTM.Application.Interfaces;
using RTM.Application.Services;

namespace RTM.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IScoreService, ScoreService>();
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}
