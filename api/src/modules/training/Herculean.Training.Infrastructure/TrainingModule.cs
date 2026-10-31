using Herculean.SharedKernel.Persistence;

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
    }

    /// <summary>Applies the Training module's pending migrations.</summary>
    /// <param name="services">The API's services.</param>
    /// <param name="cancellationToken">Stops the migration.</param>
    public static Task MigrateTrainingModuleDatabaseAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        return services.MigrateDatabaseAsync<TrainingDbContext>(cancellationToken);
    }
}
