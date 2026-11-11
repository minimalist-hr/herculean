using FluentValidation;

using Herculean.Account.Contracts;
using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Events;
using Herculean.SharedKernel.Persistence;
using Herculean.Training.Application.AccountCreated;
using Herculean.Training.Application.AccountDeleted;
using Herculean.Training.Application.Days.GetStreak;
using Herculean.Training.Application.Records;
using Herculean.Training.Application.Records.ListRecentRecords;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Days;
using Herculean.Training.Application.Days.GetDay;
using Herculean.Training.Application.Days.GetFirstDay;
using Herculean.Training.Application.Days.GetMonthSummary;
using Herculean.Training.Application.Days.ListDays;
using Herculean.Training.Application.Exercises;
using Herculean.Training.Application.Exercises.CreateExercise;
using Herculean.Training.Application.Exercises.DeleteExercise;
using Herculean.Training.Application.Exercises.GetExercise;
using Herculean.Training.Application.Exercises.GetExerciseProgress;
using Herculean.Training.Application.Exercises.GetExerciseLastTime;
using Herculean.Training.Application.Exercises.ListExerciseSessions;
using Herculean.Training.Application.Exercises.ListExercises;
using Herculean.Training.Application.Exercises.RestoreExercise;
using Herculean.Training.Application.Exercises.UpdateExercise;
using Herculean.Training.Application.Export;
using Herculean.Training.Application.Export.GetExport;
using Herculean.Training.Application.Groups;
using Herculean.Training.Application.Groups.CreateGroup;
using Herculean.Training.Application.Groups.DeleteGroup;
using Herculean.Training.Application.Groups.GetGroup;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Application.Groups.RenameGroup;
using Herculean.Training.Application.Groups.RestoreGroup;
using Herculean.Training.Application.Groups.UpdateGroupOrder;
using Herculean.Training.Application.Routines;
using Herculean.Training.Application.Routines.CreateRoutine;
using Herculean.Training.Application.Routines.DeleteRoutine;
using Herculean.Training.Application.Routines.GetRoutine;
using Herculean.Training.Application.Routines.ListRoutines;
using Herculean.Training.Application.Routines.RestoreRoutine;
using Herculean.Training.Application.Routines.UpdateRoutine;
using Herculean.Training.Application.Settings;
using Herculean.Training.Application.Settings.GetWorkoutSettings;
using Herculean.Training.Application.Settings.UpdateWorkoutSettings;
using Herculean.Training.Application.WeekPlan;
using Herculean.Training.Application.WeekPlan.ListWeekPlanDays;
using Herculean.Training.Application.Workouts;
using Herculean.Training.Application.Workouts.AddSet;
using Herculean.Training.Application.Workouts.AddWorkoutExercises;
using Herculean.Training.Application.Workouts.CreateWorkout;
using Herculean.Training.Application.Workouts.DeleteSet;
using Herculean.Training.Application.Workouts.DeleteWorkout;
using Herculean.Training.Application.Workouts.EditWorkout;
using Herculean.Training.Application.Workouts.GetWorkoutSummary;
using Herculean.Training.Application.Workouts.ListWorkouts;
using Herculean.Training.Application.Workouts.RestoreWorkout;
using Herculean.Training.Application.Workouts.UpdateWorkout;
using Herculean.Training.Application.Workouts.DeleteWorkoutExercise;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Application.Workouts.SwapWorkoutExercise;
using Herculean.Training.Application.Workouts.UpdateWorkoutExerciseLengthenedPartials;
using Herculean.Training.Application.Workouts.UpdateWorkoutExerciseSuperset;
using Herculean.Training.Application.Workouts.UpdateSet;
using Herculean.Training.Application.Workouts.UpdateWorkoutExerciseOrder;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Settings;
using Herculean.Training.Domain.WeekPlan;
using Herculean.Training.Domain.Workouts;
using Herculean.Training.Infrastructure.Days;
using Herculean.Training.Infrastructure.Exercises;
using Herculean.Training.Infrastructure.Export;
using Herculean.Training.Infrastructure.Groups;
using Herculean.Training.Infrastructure.Routines;
using Herculean.Training.Infrastructure.Settings;
using Herculean.Training.Infrastructure.WeekPlan;
using Herculean.Training.Infrastructure.Workouts;

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
        builder.Services.AddScoped<UserClock>();
        builder.Services.AddUniqueIndexError(ExerciseConfiguration.NameIndex, ExerciseErrors.NameTaken);
        builder.Services.AddUniqueIndexError(GroupConfiguration.NameIndex, GroupErrors.NameTaken);
        builder.Services.AddUniqueIndexError(RoutineConfiguration.NameIndex, RoutineErrors.NameTaken);
        builder.Services.AddUniqueIndexError(WorkoutConfiguration.DateIndex, WorkoutErrors.DateTaken);
        builder.Services.AddUniqueIndexError(WorkoutConfiguration.InProgressIndex, WorkoutErrors.AnotherInProgress);

        builder.Services.AddScoped<IWorkoutSettingsRepository, WorkoutSettingsRepository>();
        builder.Services.AddScoped<IGroupRepository, GroupRepository>();
        builder.Services.AddScoped<IExerciseRepository, ExerciseRepository>();
        builder.Services.AddScoped<IRoutineRepository, RoutineRepository>();
        builder.Services.AddScoped<IWeekPlanDayRepository, WeekPlanDayRepository>();
        builder.Services.AddScoped<IWorkoutRepository, WorkoutRepository>();
        builder.Services.AddScoped<WeekPlanner>();
        builder.Services.AddScoped<IGroupReadRepository, GroupReadRepository>();
        builder.Services.AddScoped<IExerciseReadRepository, ExerciseReadRepository>();
        builder.Services.AddScoped<IRecordReadRepository, RecordReadRepository>();
        builder.Services.AddScoped<IRoutineReadRepository, RoutineReadRepository>();
        builder.Services.AddScoped<IWeekPlanReadRepository, WeekPlanReadRepository>();
        builder.Services.AddScoped<IDayReadRepository, DayReadRepository>();
        builder.Services.AddScoped<IExportReadRepository, ExportReadRepository>();
        builder.Services.AddScoped<IWorkoutSettingsReadRepository, WorkoutSettingsReadRepository>();
        builder.Services.AddScoped<IWorkoutReadRepository, WorkoutReadRepository>();

        builder.Services.AddIntegrationEventHandler<AccountCreatedIntegrationEvent, AccountCreatedIntegrationEventHandler>();
        builder.Services.AddScoped<IUserDataRepository, UserDataRepository>();
        builder.Services.AddIntegrationEventHandler<AccountDeletedIntegrationEvent, AccountDeletedIntegrationEventHandler>();

        builder.Services.AddScoped<IValidator<UpdateWorkoutSettingsRequest>, UpdateWorkoutSettingsValidator>();
        builder.Services.AddScoped<UpdateWorkoutSettingsHandler>();
        builder.Services.AddScoped<IValidator<ListExercisesRequest>, ListExercisesValidator>();
        builder.Services.AddScoped<GetWorkoutSettingsHandler>();
        builder.Services.AddScoped<ListExercisesHandler>();
        builder.Services.AddScoped<GetExerciseHandler>();
        builder.Services.AddScoped<IValidator<ListExerciseSessionsRequest>, ListExerciseSessionsValidator>();
        builder.Services.AddScoped<ListExerciseSessionsHandler>();
        builder.Services.AddScoped<IValidator<GetExerciseLastTimeRequest>, GetExerciseLastTimeValidator>();
        builder.Services.AddScoped<GetExerciseLastTimeHandler>();
        builder.Services.AddScoped<IValidator<GetExerciseProgressRequest>, GetExerciseProgressValidator>();
        builder.Services.AddScoped<GetExerciseProgressHandler>();
        builder.Services.AddScoped<ListGroupsHandler>();
        builder.Services.AddScoped<ListRoutinesHandler>();
        builder.Services.AddScoped<IValidator<CreateRoutineRequest>, CreateRoutineValidator>();
        builder.Services.AddScoped<CreateRoutineHandler>();
        builder.Services.AddScoped<GetRoutineHandler>();
        builder.Services.AddScoped<IValidator<UpdateRoutineRequest>, UpdateRoutineValidator>();
        builder.Services.AddScoped<UpdateRoutineHandler>();
        builder.Services.AddScoped<DeleteRoutineHandler>();
        builder.Services.AddScoped<RestoreRoutineHandler>();
        builder.Services.AddScoped<ListWeekPlanDaysHandler>();
        builder.Services.AddScoped<IValidator<ListDaysRequest>, ListDaysValidator>();
        builder.Services.AddScoped<ListDaysHandler>();
        builder.Services.AddScoped<GetDayHandler>();
        builder.Services.AddScoped<GetFirstDayHandler>();
        builder.Services.AddScoped<GetStreakHandler>();
        builder.Services.AddScoped<GetExportHandler>();
        builder.Services.AddScoped<ListRecentRecordsHandler>();
        builder.Services.AddScoped<IValidator<GetMonthSummaryRequest>, GetMonthSummaryValidator>();
        builder.Services.AddScoped<GetMonthSummaryHandler>();
        builder.Services.AddScoped<IValidator<CreateWorkoutRequest>, CreateWorkoutValidator>();
        builder.Services.AddScoped<CreateWorkoutHandler>();
        builder.Services.AddScoped<DeleteWorkoutHandler>();
        builder.Services.AddScoped<IValidator<EditWorkoutRequest>, EditWorkoutValidator>();
        builder.Services.AddScoped<EditWorkoutHandler>();
        builder.Services.AddScoped<IValidator<UpdateWorkoutRequest>, UpdateWorkoutValidator>();
        builder.Services.AddScoped<UpdateWorkoutHandler>();
        builder.Services.AddScoped<RestoreWorkoutHandler>();
        builder.Services.AddScoped<GetWorkoutSummaryHandler>();
        builder.Services.AddScoped<GetWorkoutHandler>();
        builder.Services.AddScoped<IValidator<ListWorkoutsRequest>, ListWorkoutsValidator>();
        builder.Services.AddScoped<ListWorkoutsHandler>();
        builder.Services.AddScoped<IValidator<AddSetRequest>, AddSetValidator>();
        builder.Services.AddScoped<AddSetHandler>();
        builder.Services.AddScoped<IValidator<UpdateSetRequest>, UpdateSetValidator>();
        builder.Services.AddScoped<UpdateSetHandler>();
        builder.Services.AddScoped<DeleteSetHandler>();
        builder.Services.AddScoped<IValidator<AddWorkoutExercisesRequest>, AddWorkoutExercisesValidator>();
        builder.Services.AddScoped<AddWorkoutExercisesHandler>();
        builder.Services.AddScoped<DeleteWorkoutExerciseHandler>();
        builder.Services.AddScoped<IValidator<SwapWorkoutExerciseRequest>, SwapWorkoutExerciseValidator>();
        builder.Services.AddScoped<SwapWorkoutExerciseHandler>();
        builder.Services.AddScoped<IValidator<UpdateWorkoutExerciseSupersetRequest>, UpdateWorkoutExerciseSupersetValidator>();
        builder.Services.AddScoped<UpdateWorkoutExerciseSupersetHandler>();
        builder.Services.AddScoped<IValidator<UpdateWorkoutExerciseLengthenedPartialsRequest>, UpdateWorkoutExerciseLengthenedPartialsValidator>();
        builder.Services.AddScoped<UpdateWorkoutExerciseLengthenedPartialsHandler>();
        builder.Services.AddScoped<IValidator<UpdateWorkoutExerciseOrderRequest>, UpdateWorkoutExerciseOrderValidator>();
        builder.Services.AddScoped<UpdateWorkoutExerciseOrderHandler>();
        builder.Services.AddScoped<GetGroupHandler>();
        builder.Services.AddScoped<IValidator<CreateExerciseRequest>, CreateExerciseValidator>();
        builder.Services.AddScoped<CreateExerciseHandler>();
        builder.Services.AddScoped<IValidator<UpdateExerciseRequest>, UpdateExerciseValidator>();
        builder.Services.AddScoped<UpdateExerciseHandler>();
        builder.Services.AddScoped<DeleteExerciseHandler>();
        builder.Services.AddScoped<RestoreExerciseHandler>();
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
        GetWorkoutSettingsEndpoint.Map(endpoints);
        UpdateWorkoutSettingsEndpoint.Map(endpoints);
        ListExercisesEndpoint.Map(endpoints);
        ListExerciseSessionsEndpoint.Map(endpoints);
        GetExerciseLastTimeEndpoint.Map(endpoints);
        GetExerciseProgressEndpoint.Map(endpoints);
        GetExerciseEndpoint.Map(endpoints);
        ListGroupsEndpoint.Map(endpoints);
        ListRoutinesEndpoint.Map(endpoints);
        CreateRoutineEndpoint.Map(endpoints);
        GetRoutineEndpoint.Map(endpoints);
        UpdateRoutineEndpoint.Map(endpoints);
        DeleteRoutineEndpoint.Map(endpoints);
        RestoreRoutineEndpoint.Map(endpoints);
        ListWeekPlanDaysEndpoint.Map(endpoints);
        ListDaysEndpoint.Map(endpoints);
        GetFirstDayEndpoint.Map(endpoints);
        GetStreakEndpoint.Map(endpoints);
        GetExportEndpoint.Map(endpoints);
        ListRecentRecordsEndpoint.Map(endpoints);
        GetDayEndpoint.Map(endpoints);
        GetMonthSummaryEndpoint.Map(endpoints);
        CreateWorkoutEndpoint.Map(endpoints);
        DeleteWorkoutEndpoint.Map(endpoints);
        EditWorkoutEndpoint.Map(endpoints);
        UpdateWorkoutEndpoint.Map(endpoints);
        RestoreWorkoutEndpoint.Map(endpoints);
        GetWorkoutSummaryEndpoint.Map(endpoints);
        GetWorkoutEndpoint.Map(endpoints);
        ListWorkoutsEndpoint.Map(endpoints);
        AddSetEndpoint.Map(endpoints);
        UpdateSetEndpoint.Map(endpoints);
        DeleteSetEndpoint.Map(endpoints);
        AddWorkoutExercisesEndpoint.Map(endpoints);
        DeleteWorkoutExerciseEndpoint.Map(endpoints);
        SwapWorkoutExerciseEndpoint.Map(endpoints);
        UpdateWorkoutExerciseSupersetEndpoint.Map(endpoints);
        UpdateWorkoutExerciseLengthenedPartialsEndpoint.Map(endpoints);
        UpdateWorkoutExerciseOrderEndpoint.Map(endpoints);
        GetGroupEndpoint.Map(endpoints);
        CreateExerciseEndpoint.Map(endpoints);
        UpdateExerciseEndpoint.Map(endpoints);
        DeleteExerciseEndpoint.Map(endpoints);
        RestoreExerciseEndpoint.Map(endpoints);
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
