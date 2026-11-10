using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts;
using Herculean.Training.Application.Workouts.UpdateWorkout;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Training.UnitTests.Application.Workouts.UpdateWorkout;

public sealed class UpdateWorkoutHandlerTests
{
    private readonly FakeWorkoutRepository _workoutRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeTimeProvider _time = new(new DateTimeOffset(2026, 11, 3, 18, 0, 0, TimeSpan.Zero));
    private readonly UpdateWorkoutHandler _handler;
    private readonly Workout _workout = Workout.Start(
        UserId.From(Guid.CreateVersion7()),
        new DateOnly(2026, 11, 3),
        RoutineId.New(),
        "Legs",
        [new RoutineExerciseValues(ExerciseId.New(), 2, 8, 10)],
        new Dictionary<ExerciseId, List<SetValues>>(),
        null);

    public UpdateWorkoutHandlerTests()
    {
        _workoutRepository.Add(_workout);
        _handler = new UpdateWorkoutHandler(new UpdateWorkoutValidator(), _workoutRepository, _unitOfWork, _time);
    }

    private Task<Result<WorkoutResponse>> SaveAsync(Guid id, WorkoutStatus status = WorkoutStatus.Completed) =>
        _handler.HandleAsync(id, new UpdateWorkoutRequest(status), TestContext.Current.CancellationToken);

    [Fact]
    public async Task APastDayTakesTheTypedMinutes()
    {
        WorkoutExercise exercise = _workout.Exercises[0];
        _workout.UpdateSet(exercise.Id, exercise.Sets[0].Id, null, null, true);

        await _handler.HandleAsync(_workout.Id.Value, new UpdateWorkoutRequest(WorkoutStatus.Completed, 75), TestContext.Current.CancellationToken);

        _workout.DurationSeconds.ShouldBe(4500);
    }

    [Fact]
    public async Task APastDayCanBeSavedWithoutMinutes()
    {
        WorkoutExercise exercise = _workout.Exercises[0];
        _workout.UpdateSet(exercise.Id, exercise.Sets[0].Id, null, null, true);

        await SaveAsync(_workout.Id.Value);

        _workout.DurationSeconds.ShouldBeNull();
    }

    [Fact]
    public async Task ATimedWorkoutCountsItsOwnTimeAndIgnoresMinutes()
    {
        Workout timed = Workout.Start(
            UserId.From(Guid.CreateVersion7()),
            new DateOnly(2026, 11, 3),
            RoutineId.New(),
            "Legs",
            [new RoutineExerciseValues(ExerciseId.New(), 1, 8, 10)],
            new Dictionary<ExerciseId, List<SetValues>>(),
            _time.GetUtcNow().AddMinutes(-50));
        WorkoutExercise exercise = timed.Exercises[0];
        timed.UpdateSet(exercise.Id, exercise.Sets[0].Id, null, null, true);
        _workoutRepository.Add(timed);

        await _handler.HandleAsync(timed.Id.Value, new UpdateWorkoutRequest(WorkoutStatus.Completed, 5), TestContext.Current.CancellationToken);

        timed.DurationSeconds.ShouldBe(3000);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(601)]
    public async Task MinutesOutsideTheLimitsFailWithAFieldError(int minutes)
    {
        Result<WorkoutResponse> result = await _handler.HandleAsync(_workout.Id.Value, new UpdateWorkoutRequest(WorkoutStatus.Completed, minutes), TestContext.Current.CancellationToken);

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("durationMinutes");
    }

    [Fact]
    public async Task SavingCompletesTheWorkout()
    {
        WorkoutExercise exercise = _workout.Exercises[0];
        _workout.UpdateSet(exercise.Id, exercise.Sets[0].Id, null, null, true);

        Result<WorkoutResponse> result = await SaveAsync(_workout.Id.Value);

        result.Value.Status.ShouldBe(WorkoutStatus.Completed);
        _workout.FinishedAtUtc.ShouldBe(_time.GetUtcNow());
        exercise.Sets.Count.ShouldBe(1);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task NothingCheckedSavesNothing()
    {
        Result<WorkoutResponse> result = await SaveAsync(_workout.Id.Value);

        result.Error.ShouldBe(WorkoutErrors.NothingChecked);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AnUnknownWorkoutIsNotFound()
    {
        Result<WorkoutResponse> result = await SaveAsync(Guid.CreateVersion7());

        result.Error.ShouldBe(WorkoutErrors.NotFound);
    }

    [Fact]
    public async Task OnlyCompletedCanBeSet()
    {
        Result<WorkoutResponse> inProgress = await SaveAsync(_workout.Id.Value, WorkoutStatus.InProgress);
        Result<WorkoutResponse> skipped = await SaveAsync(_workout.Id.Value, WorkoutStatus.Skipped);

        inProgress.IsSuccess.ShouldBeFalse();
        skipped.IsSuccess.ShouldBeFalse();
        _workout.Status.ShouldBe(WorkoutStatus.InProgress);
    }
}
