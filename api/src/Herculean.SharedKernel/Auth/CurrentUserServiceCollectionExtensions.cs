using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Herculean.SharedKernel.Auth;

/// <summary>Registers the current user accessor once, however many modules ask for it.</summary>
public static class CurrentUserServiceCollectionExtensions
{
    /// <summary>Adds <see cref="ICurrentUserAccessor"/>.</summary>
    /// <param name="services">The API's services.</param>
    public static IServiceCollection AddCurrentUserAccessor(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.TryAddSingleton<ICurrentUserAccessor, CurrentUserAccessor>();

        return services;
    }
}
