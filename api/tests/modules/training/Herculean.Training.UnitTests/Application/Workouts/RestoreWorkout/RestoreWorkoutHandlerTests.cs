using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts;
using Herculean.Training.Application.Workouts.RestoreWorkout;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Application.Workouts.RestoreWorkout;

public sealed class RestoreWorkoutHandlerTests
{
    private static readonly DateOnly Date = new(2026, 11, 3);
    private static readonly DateTimeOffset Now = new(2026, 11, 3, 18, 0, 0, TimeSpan.Zero);

    private readonly FakeWorkoutRepository _workoutRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly RestoreWorkoutHandler _handler;

    public RestoreWorkoutHandlerTests()
    {
        _handler = new RestoreWorkoutHandler(_workoutRepository, _unitOfWork);
    }

    private Workout Add(DateOnly date, bool deleted)
    {
        Workout workout = Workout.Start(
            UserId.From(Guid.CreateVersion7()),
            date,
            RoutineId.New(),
            "Legs",
            [],
            new Dictionary<ExerciseId, List<SetValues>>(),
            null);
        if (deleted)
        {
            workout.Delete(Now);
        }

        _workoutRepository.Add(workout);

        return workout;
    }

    private Task<Result<WorkoutResponse>> RestoreAsync(Guid id) =>
        _handler.HandleAsync(id, TestContext.Current.CancellationToken);

    [Fact]
    public async Task ADeletedWorkoutComesBack()
    {
        Workout workout = Add(Date, deleted: true);

        Result<WorkoutResponse> result = await RestoreAsync(workout.Id.Value);

        result.Value.Status.ShouldBe(WorkoutStatus.InProgress);
        workout.DeletedAtUtc.ShouldBeNull();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AWorkoutThatIsNotDeletedIsNotFound()
    {
        Workout workout = Add(Date, deleted: false);

        Result<WorkoutResponse> result = await RestoreAsync(workout.Id.Value);

        result.Error.ShouldBe(WorkoutErrors.NotFound);
    }

    [Fact]
    public async Task ADateWithAnotherWorkoutNowFails()
    {
        Workout workout = Add(Date, deleted: true);
        Add(Date, deleted: false);

        Result<WorkoutResponse> result = await RestoreAsync(workout.Id.Value);

        result.Error.ShouldBe(WorkoutErrors.DateTaken);
        workout.DeletedAtUtc.ShouldNotBeNull();
    }

    [Fact]
    public async Task AnotherWorkoutInProgressNowFails()
    {
        Workout workout = Add(Date, deleted: true);
        Add(Date.AddDays(-1), deleted: false);

        Result<WorkoutResponse> result = await RestoreAsync(workout.Id.Value);

        result.Error.ShouldBe(WorkoutErrors.AnotherInProgress);
        _unitOfWork.Saved.ShouldBeFalse();
    }
}
