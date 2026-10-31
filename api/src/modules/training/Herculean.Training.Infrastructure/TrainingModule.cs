using FluentValidation;

using Herculean.Account.Contracts;
using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Events;
using Herculean.SharedKernel.Persistence;
using Herculean.Training.Application.AccountCreated;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Settings.UpdateWorkoutSettings;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Settings;
using Herculean.Training.Infrastructure.Groups;
using Herculean.Training.Infrastructure.Settings;

using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Herculean.Training.Infrastructure;

/// <summary>The Training module: exercises, routines and workouts. The only way into the module.</summary>
public static class TrainingModule
{
    /// <summary>Registers everything the Training module needs.</summary>
    /// <param name="builder">The API's builder.</param>
    public static void AddTrainingModule(this IHostApplicationBuilder builder)
    {
        builder.AddModuleDbContext<TrainingDbContext>(TrainingDbContext.Schema);
        builder.Services.AddScoped<IUnitOfWork>(services => services.GetRequiredService<TrainingDbContext>());

        builder.Services.AddCurrentUserAccessor();
        builder.Services.AddScoped<CurrentUser>();

        builder.Services.AddScoped<IWorkoutSettingsRepository, WorkoutSettingsRepository>();
        builder.Services.AddScoped<IGroupRepository, GroupRepository>();

        builder.Services.AddIntegrationEventHandler<AccountCreatedIntegrationEvent, AccountCreatedIntegrationEventHandler>();

        builder.Services.AddScoped<IValidator<UpdateWorkoutSettingsRequest>, UpdateWorkoutSettingsValidator>();
        builder.Services.AddScoped<UpdateWorkoutSettingsHandler>();
    }

    /// <summary>Maps every Training endpoint.</summary>
    /// <param name="endpoints">The API's endpoints.</param>
    public static void MapTrainingModuleEndpoints(this IEndpointRouteBuilder endpoints)
    {
        UpdateWorkoutSettingsEndpoint.Map(endpoints);
    }

    /// <summary>Applies the Training module's pending migrations.</summary>
    /// <param name="services">The API's services.</param>
    /// <param name="cancellationToken">Stops the migration.</param>
    public static Task MigrateTrainingModuleDatabaseAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        return services.MigrateDatabaseAsync<TrainingDbContext>(cancellationToken);
    }
}
