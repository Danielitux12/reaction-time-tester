using Microsoft.Extensions.DependencyInjection;

namespace RTM.Api;

public static class DependencyInjection
{
    public static IServiceCollection AddApi(this IServiceCollection services)
    {
        services.AddControllers()
            .AddApplicationPart(typeof(DependencyInjection).Assembly);

        return services;
    }
}
