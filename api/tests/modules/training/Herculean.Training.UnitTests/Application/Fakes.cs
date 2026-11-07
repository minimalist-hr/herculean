using System.Globalization;

using Herculean.Account.Contracts;
using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Queries;
using Herculean.Training.Application.Days;
using Herculean.Training.Application.Days.GetDay;
using Herculean.Training.Application.Exercises;
using Herculean.Training.Application.Exercises.GetExercise;
using Herculean.Training.Application.Exercises.GetExerciseProgress;
using Herculean.Training.Application.Exercises.ListExerciseSessions;
using Herculean.Training.Application.Exercises.ListExercises;
using Herculean.Training.Application.Groups;
using Herculean.Training.Application.Groups.GetGroup;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Application.Routines;
using Herculean.Training.Application.Routines.GetRoutine;
using Herculean.Training.Application.Routines.ListRoutines;
using Herculean.Training.Application.Settings;
using Herculean.Training.Application.WeekPlan;
using Herculean.Training.Application.WeekPlan.ListWeekPlanDays;
using Herculean.Training.Application.Workouts;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Settings;
using Herculean.Training.Domain.WeekPlan;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Application;

internal sealed class FakeCurrentUserAccessor : ICurrentUserAccessor
{
    public Guid UserId { get; set; } = Guid.CreateVersion7();
}

internal sealed class FakeWorkoutSettingsReadRepository : IWorkoutSettingsReadRepository
{
    public WorkoutSettingsResponse? Settings { get; set; }

    public Task<WorkoutSettingsResponse?> GetAsync(CancellationToken cancellationToken) => Task.FromResult(Settings);
}

internal sealed class FakeWorkoutSettingsRepository : IWorkoutSettingsRepository
{
    public List<WorkoutSettings> WorkoutSettings { get; } = [];

    public Task<WorkoutSettings?> GetForCurrentUserAsync(CancellationToken cancellationToken) =>
        Task.FromResult(WorkoutSettings.SingleOrDefault());

    public Task<bool> ExistsForUserAsync(UserId userId, CancellationToken cancellationToken) =>
        Task.FromResult(WorkoutSettings.Any(workoutSettings => workoutSettings.UserId == userId));

    public void Add(WorkoutSettings workoutSettings)
    {
        WorkoutSettings.Add(workoutSettings);
    }
}

internal sealed class FakeGroupRepository : IGroupRepository
{
    public List<Group> Groups { get; } = [];

    public HashSet<GroupId> UsedGroupIds { get; } = [];

    /// <summary>The count to report, so a test needs no 50 groups.</summary>
    public int? Count { get; set; }

    public Task<bool> AnyForUserAsync(UserId userId, CancellationToken cancellationToken) =>
        Task.FromResult(Groups.Any(group => group.UserId == userId));

    public Task<bool> AllExistAsync(IReadOnlyCollection<GroupId> ids, CancellationToken cancellationToken) =>
        Task.FromResult(ids.All(id => Active.Any(group => group.Id == id)));

    public Task<List<Group>> ListAsync(CancellationToken cancellationToken) =>
        Task.FromResult(Active.ToList());

    public Task<Group?> GetAsync(GroupId id, CancellationToken cancellationToken) =>
        Task.FromResult(Active.SingleOrDefault(group => group.Id == id));

    public Task<Group?> GetDeletedAsync(GroupId id, CancellationToken cancellationToken) =>
        Task.FromResult(Groups.SingleOrDefault(group => group.Id == id && group.DeletedAtUtc is not null));

    public Task<int> CountAsync(CancellationToken cancellationToken) =>
        Task.FromResult(Count ?? Active.Count());

    public Task<int> NextOrderAsync(CancellationToken cancellationToken) =>
        Task.FromResult(Groups.Count == 0 ? 0 : Groups.Max(group => group.Order) + 1);

    public Task<bool> NameExistsAsync(string name, GroupId? exceptId, CancellationToken cancellationToken) =>
        Task.FromResult(Active.Any(group => group.Id != exceptId && group.NormalizedName == Group.NormalizeName(name)));

    public Task<bool> IsInUseAsync(GroupId id, CancellationToken cancellationToken) =>
        Task.FromResult(UsedGroupIds.Contains(id));

    public void Add(Group group)
    {
        Groups.Add(group);
    }

    public void AddRange(IEnumerable<Group> groups)
    {
        Groups.AddRange(groups);
    }

    private IEnumerable<Group> Active => Groups.Where(group => group.DeletedAtUtc is null);
}

internal sealed class FakeGroupReadRepository : IGroupReadRepository
{
    public List<GroupListItemResponse> Groups { get; } = [];

    public List<GroupDetailsResponse> Details { get; } = [];

    public Task<List<GroupListItemResponse>> ListAsync(CancellationToken cancellationToken) => Task.FromResult(Groups);

    public Task<GroupDetailsResponse?> GetAsync(GroupId id, CancellationToken cancellationToken) =>
        Task.FromResult(Details.SingleOrDefault(group => group.Id == id.Value));
}

internal sealed class FakeExerciseReadRepository : IExerciseReadRepository
{
    public List<ExerciseListItemResponse> Exercises { get; } = [];

    public List<ExerciseDetailsResponse> Details { get; } = [];

    public string? Search { get; private set; }

    public GroupId? GroupId { get; private set; }

    public Task<List<ExerciseListItemResponse>> ListAsync(string? search, GroupId? groupId, CancellationToken cancellationToken)
    {
        Search = search;
        GroupId = groupId;

        return Task.FromResult(Exercises);
    }

    public Task<ExerciseDetailsResponse?> GetAsync(ExerciseId id, CancellationToken cancellationToken) =>
        Task.FromResult(Details.SingleOrDefault(exercise => exercise.Id == id.Value));

    /// <summary>The sessions of every exercise that exists, newest first.</summary>
    public List<ExerciseSessionResponse> Sessions { get; } = [];

    public HashSet<ExerciseId> Existing { get; } = [];

    public Task<bool> ExistsAsync(ExerciseId id, CancellationToken cancellationToken) => Task.FromResult(Existing.Contains(id));

    public Task<List<ExerciseSessionResponse>> ListSessionsAsync(ExerciseId id, DateOnly? before, int take, CancellationToken cancellationToken) =>
        Task.FromResult(Sessions.Where(session => before is null || session.Date < before).Take(take).ToList());

    public Task<List<SessionMonthResponse>> ListSessionMonthsAsync(ExerciseId id, DateOnly from, DateOnly to, CancellationToken cancellationToken) =>
        Task.FromResult(Sessions
            .Where(session => session.Date >= from && session.Date <= to)
            .GroupBy(session => session.Date.ToString("yyyy-MM", CultureInfo.InvariantCulture))
            .Select(month => new SessionMonthResponse(month.Key, month.Count()))
            .ToList());

    /// <summary>Each session's heaviest set, oldest first.</summary>
    public List<ProgressPointResponse> HeaviestSets { get; } = [];

    /// <summary>The first date the last heaviest sets read asked for.</summary>
    public DateOnly? HeaviestFrom { get; private set; }

    public Task<List<ProgressPointResponse>> ListHeaviestSetsAsync(ExerciseId id, DateOnly? from, CancellationToken cancellationToken)
    {
        HeaviestFrom = from;

        return Task.FromResult(HeaviestSets.Where(point => from is null || point.Date >= from).ToList());
    }
}

internal sealed class FakeExerciseRepository : IExerciseRepository
{
    public List<Exercise> Exercises { get; } = [];

    /// <summary>The count to report, so a test needs no 500 exercises.</summary>
    public int? Count { get; set; }

    public Task<int> CountAsync(CancellationToken cancellationToken) => Task.FromResult(Count ?? Exercises.Count);

    public Task<Exercise?> GetAsync(ExerciseId id, CancellationToken cancellationToken) =>
        Task.FromResult(Exercises.SingleOrDefault(exercise => exercise.Id == id && exercise.DeletedAtUtc is null));

    public Task<Exercise?> GetDeletedAsync(ExerciseId id, CancellationToken cancellationToken) =>
        Task.FromResult(Exercises.SingleOrDefault(exercise => exercise.Id == id && exercise.DeletedAtUtc is not null));

    public Task<bool> NameExistsAsync(string name, ExerciseId? exceptId, CancellationToken cancellationToken) =>
        Task.FromResult(Exercises.Any(exercise =>
            exercise.DeletedAtUtc is null && exercise.Id != exceptId && exercise.NormalizedName == Exercise.NormalizeName(name)));

    public Task<bool> AllExistAsync(IReadOnlyCollection<ExerciseId> ids, CancellationToken cancellationToken) =>
        Task.FromResult(ids.All(id => Exercises.Any(exercise => exercise.Id == id && exercise.DeletedAtUtc is null)));

    public void Add(Exercise exercise)
    {
        Exercises.Add(exercise);
    }
}

internal sealed class FakeRoutineRepository : IRoutineRepository
{
    public List<Routine> Routines { get; } = [];

    /// <summary>The count to report, so a test needs no 50 routines.</summary>
    public int? Count { get; set; }

    public Task<int> CountAsync(CancellationToken cancellationToken) => Task.FromResult(Count ?? Routines.Count);

    public Task<Routine?> GetAsync(RoutineId id, CancellationToken cancellationToken) =>
        Task.FromResult(Active.SingleOrDefault(routine => routine.Id == id));

    public Task<Routine?> GetDeletedAsync(RoutineId id, CancellationToken cancellationToken) =>
        Task.FromResult(Routines.SingleOrDefault(routine => routine.Id == id && routine.DeletedAtUtc is not null));

    public Task<bool> NameExistsAsync(string name, RoutineId? exceptId, CancellationToken cancellationToken) =>
        Task.FromResult(Active.Any(routine => routine.Id != exceptId && routine.NormalizedName == Routine.NormalizeName(name)));

    public Task<bool> UsesExerciseAsync(ExerciseId exerciseId, CancellationToken cancellationToken) =>
        Task.FromResult(Active.Any(routine => routine.Exercises.Any(exercise => exercise.ExerciseId == exerciseId)));

    public void Add(Routine routine)
    {
        Routines.Add(routine);
    }

    private IEnumerable<Routine> Active => Routines.Where(routine => routine.DeletedAtUtc is null);
}

internal sealed class FakeRoutineReadRepository : IRoutineReadRepository
{
    public List<RoutineListItemResponse> Items { get; } = [];

    public List<RoutineDetailsResponse> Details { get; } = [];

    public Dictionary<RoutineId, string> Names { get; } = [];

    public Task<Dictionary<RoutineId, string>> ListNamesAsync(CancellationToken cancellationToken) => Task.FromResult(Names);

    public Task<List<RoutineListItemResponse>> ListAsync(CancellationToken cancellationToken) => Task.FromResult(Items);

    public Task<RoutineDetailsResponse?> GetAsync(RoutineId id, CancellationToken cancellationToken) =>
        Task.FromResult(Details.SingleOrDefault(routine => routine.Id == id.Value));
}

internal sealed class FakeWeekPlanReadRepository : IWeekPlanReadRepository
{
    public List<WeekPlanDayResponse> Items { get; } = [];

    public Task<List<WeekPlanDayResponse>> ListAsync(CancellationToken cancellationToken) => Task.FromResult(Items);
}

internal sealed class FakeDayReadRepository : IDayReadRepository
{
    public List<PlanChange> Changes { get; } = [];

    public List<DayExerciseResponse> Exercises { get; } = [];

    public bool HasRoutines { get; set; } = true;

    public List<DayWorkout> Workouts { get; } = [];

    public List<DoneWorkoutTotals> DoneWorkouts { get; } = [];

    public Task<List<DoneWorkoutTotals>> ListDoneWorkoutTotalsAsync(DateOnly from, DateOnly to, CancellationToken cancellationToken) =>
        Task.FromResult(DoneWorkouts.Where(workout => workout.Date >= from && workout.Date <= to).ToList());

    public DateOnly? FirstWorkoutDate { get; set; }

    public Task<DateOnly?> GetFirstWorkoutDateAsync(CancellationToken cancellationToken) => Task.FromResult(FirstWorkoutDate);

    public List<DayExerciseResponse> WorkoutExercises { get; } = [];

    public Task<List<DayExerciseResponse>> ListWorkoutExercisesAsync(WorkoutId workoutId, CancellationToken cancellationToken) => Task.FromResult(WorkoutExercises);

    public Task<DayWorkout?> GetWorkoutAsync(DateOnly date, CancellationToken cancellationToken) =>
        Task.FromResult(Workouts.SingleOrDefault(workout => workout.Date == date));

    public Task<List<DayWorkout>> ListWorkoutsAsync(DateOnly from, DateOnly to, CancellationToken cancellationToken) =>
        Task.FromResult(Workouts.Where(workout => workout.Date >= from && workout.Date <= to).ToList());

    public Task<List<PlanChange>> ListPlanChangesAsync(CancellationToken cancellationToken) => Task.FromResult(Changes);

    public Task<List<DayExerciseResponse>> ListExercisesAsync(RoutineId routineId, CancellationToken cancellationToken) => Task.FromResult(Exercises);

    public Task<bool> HasRoutinesAsync(CancellationToken cancellationToken) => Task.FromResult(HasRoutines);
}

internal sealed class FakeWorkoutReadRepository : IWorkoutReadRepository
{
    public WorkoutDetailsResponse? Workout { get; set; }

    public List<WorkoutResponse> Workouts { get; } = [];

    public Task<List<WorkoutResponse>> ListAsync(WorkoutStatus status, CancellationToken cancellationToken) =>
        Task.FromResult(Workouts.Where(workout => workout.Status == status).ToList());

    public List<RoutineExerciseValues> RoutineExercises { get; } = [];

    public Dictionary<ExerciseId, LastTimeResponse> LastTime { get; } = [];

    public List<EarlierMostReps> EarlierMostReps { get; } = [];

    public Task<List<EarlierMostReps>> ListEarlierMostRepsAsync(List<ExerciseId> exerciseIds, DateOnly before, CancellationToken cancellationToken) =>
        Task.FromResult(EarlierMostReps);

    public Task<WorkoutDetailsResponse?> GetAsync(WorkoutId id, CancellationToken cancellationToken) =>
        Task.FromResult(Workout?.Id == id.Value ? Workout : null);

    public Task<List<RoutineExerciseValues>> ListRoutineExercisesAsync(RoutineId routineId, CancellationToken cancellationToken) =>
        Task.FromResult(RoutineExercises);

    public Task<Dictionary<ExerciseId, LastTimeResponse>> ListLastTimeAsync(List<ExerciseId> exerciseIds, DateOnly before, CancellationToken cancellationToken) =>
        Task.FromResult(LastTime);
}

internal sealed class FakeWorkoutRepository : IWorkoutRepository
{
    public List<Workout> Workouts { get; } = [];

    public Task<Workout?> GetAsync(WorkoutId id, CancellationToken cancellationToken) =>
        Task.FromResult(Workouts.SingleOrDefault(workout => workout.Id == id && workout.DeletedAtUtc is null));

    public Task<Workout?> GetWithSetsAsync(WorkoutId id, CancellationToken cancellationToken) => GetAsync(id, cancellationToken);

    public Task<Workout?> GetDeletedAsync(WorkoutId id, CancellationToken cancellationToken) =>
        Task.FromResult(Workouts.SingleOrDefault(workout => workout.Id == id && workout.DeletedAtUtc is not null));

    public Task<bool> InProgressExistsAsync(CancellationToken cancellationToken) =>
        Task.FromResult(Workouts.Any(workout => workout.Status == WorkoutStatus.InProgress && workout.DeletedAtUtc is null));

    public Task<bool> ExistsOnAsync(DateOnly date, CancellationToken cancellationToken) =>
        Task.FromResult(Workouts.Any(workout => workout.Date == date && workout.DeletedAtUtc is null));

    public void Add(Workout workout)
    {
        Workouts.Add(workout);
    }
}

internal sealed class FakeWeekPlanDayRepository : IWeekPlanDayRepository
{
    public List<WeekPlanDay> Days { get; } = [];

    public Task<List<WeekPlanDay>> ListAsync(CancellationToken cancellationToken) => Task.FromResult(Days.ToList());

    public void Add(WeekPlanDay day)
    {
        Days.Add(day);
    }
}

internal sealed class FakeGetUserTimeZone : IQueryHandler<GetUserTimeZoneQuery, string>
{
    public string TimeZone { get; set; } = "Europe/Zagreb";

    public Task<string> HandleAsync(GetUserTimeZoneQuery query, CancellationToken cancellationToken) => Task.FromResult(TimeZone);
}

internal sealed class FakeGetUserCreatedAt : IQueryHandler<GetUserCreatedAtQuery, DateTimeOffset>
{
    public DateTimeOffset CreatedAtUtc { get; set; } = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);

    public Task<DateTimeOffset> HandleAsync(GetUserCreatedAtQuery query, CancellationToken cancellationToken) => Task.FromResult(CreatedAtUtc);
}

internal sealed class FakeUnitOfWork : IUnitOfWork
{
    public bool Saved { get; private set; }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        Saved = true;

        return Task.CompletedTask;
    }
}
