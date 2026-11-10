using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Application.Workouts.GetWorkoutSummary;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Workouts;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Training.UnitTests.Application.Workouts.GetWorkoutSummary;

public sealed class GetWorkoutSummaryHandlerTests
{
    private static readonly DateOnly Date = new(2026, 11, 3);
    private static readonly DateTimeOffset Now = new(2026, 11, 3, 18, 0, 0, TimeSpan.Zero);

    private readonly ExerciseId _squat = ExerciseId.New();
    private readonly ExerciseId _press = ExerciseId.New();
    private readonly FakeWorkoutReadRepository _workoutReadRepository = new();
    private readonly GetWorkoutSummaryHandler _handler;

    public GetWorkoutSummaryHandlerTests()
    {
        _handler = new GetWorkoutSummaryHandler(_workoutReadRepository, new FakeTimeProvider(Now));
    }

    private static SetResponse Set(decimal weightKg, int reps, bool isChecked) =>
        new(Guid.CreateVersion7(), 0, weightKg, reps, isChecked);

    private static WorkoutExerciseResponse Exercise(ExerciseId id, string name, params SetResponse[] sets) =>
        new(Guid.CreateVersion7(), id.Value, name, Guid.CreateVersion7(), "Legs", sets.Length, 8, 10, [.. sets], null);

    private Guid Answer(DateTimeOffset? startedAtUtc, DateTimeOffset? finishedAtUtc, params WorkoutExerciseResponse[] exercises)
    {
        Guid id = Guid.CreateVersion7();
        _workoutReadRepository.Workout = new WorkoutDetailsResponse(id, Date, WorkoutStatus.InProgress, "Legs", startedAtUtc, [.. exercises], finishedAtUtc);

        return id;
    }

    private async Task<WorkoutSummaryResponse> GetAsync(Guid id) =>
        (await _handler.HandleAsync(id, TestContext.Current.CancellationToken)).Value;

    [Fact]
    public async Task CountsSetsAndVolumeOfCheckedSetsOnly()
    {
        Guid id = Answer(null, null, Exercise(_squat, "Squat", Set(100, 5, true), Set(100, 5, true), Set(100, 5, false)));

        WorkoutSummaryResponse summary = await GetAsync(id);

        summary.Name.ShouldBe("Legs");
        summary.Date.ShouldBe(Date);
        summary.SetsChecked.ShouldBe(2);
        summary.SetsTotal.ShouldBe(3);
        summary.VolumeKg.ShouldBe(1000);
    }

    [Fact]
    public async Task AWorkoutInProgressRunsUntilNow()
    {
        Guid id = Answer(Now.AddMinutes(-64).AddSeconds(-10), null);

        (await GetAsync(id)).DurationSeconds.ShouldBe(3850);
    }

    [Fact]
    public async Task ASavedWorkoutShowsItsStoredDuration()
    {
        Guid id = Guid.CreateVersion7();
        _workoutReadRepository.Workout = new WorkoutDetailsResponse(id, Date, WorkoutStatus.Completed, "Legs", Now.AddHours(-3), [], Now.AddHours(-2), 2400);

        (await GetAsync(id)).DurationSeconds.ShouldBe(2400);
    }

    [Fact]
    public async Task APastDayHasNoDuration()
    {
        Guid id = Answer(null, null);

        (await GetAsync(id)).DurationSeconds.ShouldBeNull();
    }

    [Fact]
    public async Task ListsExercisesWithUncheckedSets()
    {
        Guid id = Answer(
            null,
            null,
            Exercise(_squat, "Squat", Set(100, 5, true)),
            Exercise(_press, "Press", Set(50, 5, true), Set(50, 5, false)));

        (await GetAsync(id)).UncheckedExercises.ShouldBe([new UncheckedExerciseResponse("Press", 1, 2)]);
    }

    [Fact]
    public async Task ListsARecordPerExerciseInOrder()
    {
        _workoutReadRepository.EarlierMostReps.Add(new EarlierMostReps(_squat, 100, 5));
        _workoutReadRepository.EarlierMostReps.Add(new EarlierMostReps(_press, 50, 8));
        Guid id = Answer(
            null,
            null,
            Exercise(_squat, "Squat", Set(110, 3, true), Set(100, 6, true)),
            Exercise(_press, "Press", Set(50, 9, true)));

        (await GetAsync(id)).Records.ShouldBe(
        [
            new WorkoutRecordResponse("Squat", RecordKind.HeaviestWeight, 110, 3),
            new WorkoutRecordResponse("Press", RecordKind.MostReps, 50, 9),
        ]);
    }

    [Fact]
    public async Task UncheckedSetsSetNoRecord()
    {
        _workoutReadRepository.EarlierMostReps.Add(new EarlierMostReps(_squat, 100, 5));
        Guid id = Answer(null, null, Exercise(_squat, "Squat", Set(200, 5, false)));

        (await GetAsync(id)).Records.ShouldBeEmpty();
    }

    [Fact]
    public async Task AnUnknownWorkoutIsNotFound()
    {
        Result<WorkoutSummaryResponse> result = await _handler.HandleAsync(Guid.CreateVersion7(), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.NotFound);
    }
}
