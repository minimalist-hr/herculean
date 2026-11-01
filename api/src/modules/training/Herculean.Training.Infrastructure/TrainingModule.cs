using FluentValidation;

using Herculean.Account.Contracts;
using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Events;
using Herculean.SharedKernel.Persistence;
using Herculean.Training.Application.AccountCreated;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Exercises;
using Herculean.Training.Application.Exercises.CreateExercise;
using Herculean.Training.Application.Exercises.DeleteExercise;
using Herculean.Training.Application.Exercises.GetExercise;
using Herculean.Training.Application.Exercises.ListExercises;
using Herculean.Training.Application.Exercises.UpdateExercise;
using Herculean.Training.Application.Groups;
using Herculean.Training.Application.Groups.CreateGroup;
using Herculean.Training.Application.Groups.DeleteGroup;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Application.Groups.RenameGroup;
using Herculean.Training.Application.Groups.RestoreGroup;
using Herculean.Training.Application.Groups.UpdateGroupOrder;
using Herculean.Training.Application.Settings.UpdateWorkoutSettings;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Settings;
using Herculean.Training.Infrastructure.Exercises;
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
        builder.Services.AddScoped<IExerciseRepository, ExerciseRepository>();
        builder.Services.AddScoped<IGroupReadRepository, GroupReadRepository>();
        builder.Services.AddScoped<IExerciseReadRepository, ExerciseReadRepository>();

        builder.Services.AddIntegrationEventHandler<AccountCreatedIntegrationEvent, AccountCreatedIntegrationEventHandler>();

        builder.Services.AddScoped<IValidator<UpdateWorkoutSettingsRequest>, UpdateWorkoutSettingsValidator>();
        builder.Services.AddScoped<UpdateWorkoutSettingsHandler>();
        builder.Services.AddScoped<IValidator<ListExercisesRequest>, ListExercisesValidator>();
        builder.Services.AddScoped<ListExercisesHandler>();
        builder.Services.AddScoped<GetExerciseHandler>();
        builder.Services.AddScoped<ListGroupsHandler>();
        builder.Services.AddScoped<IValidator<CreateExerciseRequest>, CreateExerciseValidator>();
        builder.Services.AddScoped<CreateExerciseHandler>();
        builder.Services.AddScoped<IValidator<UpdateExerciseRequest>, UpdateExerciseValidator>();
        builder.Services.AddScoped<UpdateExerciseHandler>();
        builder.Services.AddScoped<DeleteExerciseHandler>();
        builder.Services.AddScoped<IValidator<CreateGroupRequest>, CreateGroupValidator>();
        builder.Services.AddScoped<CreateGroupHandler>();
        builder.Services.AddScoped<IValidator<RenameGroupRequest>, RenameGroupValidator>();
        builder.Services.AddScoped<RenameGroupHandler>();
        builder.Services.AddScoped<DeleteGroupHandler>();
        builder.Services.AddScoped<RestoreGroupHandler>();
        builder.Services.AddScoped<IValidator<UpdateGroupOrderRequest>, UpdateGroupOrderValidator>();
        builder.Services.AddScoped<UpdateGroupOrderHandler>();
    }

    /// <summary>Maps every Training endpoint.</summary>
    /// <param name="endpoints">The API's endpoints.</param>
    public static void MapTrainingModuleEndpoints(this IEndpointRouteBuilder endpoints)
    {
        UpdateWorkoutSettingsEndpoint.Map(endpoints);
        ListExercisesEndpoint.Map(endpoints);
        GetExerciseEndpoint.Map(endpoints);
        ListGroupsEndpoint.Map(endpoints);
        CreateExerciseEndpoint.Map(endpoints);
        UpdateExerciseEndpoint.Map(endpoints);
        DeleteExerciseEndpoint.Map(endpoints);
        CreateGroupEndpoint.Map(endpoints);
        RenameGroupEndpoint.Map(endpoints);
        DeleteGroupEndpoint.Map(endpoints);
        RestoreGroupEndpoint.Map(endpoints);
        UpdateGroupOrderEndpoint.Map(endpoints);
    }

    /// <summary>Applies the Training module's pending migrations.</summary>
    /// <param name="services">The API's services.</param>
    /// <param name="cancellationToken">Stops the migration.</param>
    public static Task MigrateTrainingModuleDatabaseAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        return services.MigrateDatabaseAsync<TrainingDbContext>(cancellationToken);
    }
}
