using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Days;
using Herculean.Training.Application.Days.GetDay;
using Herculean.Training.Application.Workouts;
using Herculean.Training.Application.Workouts.CreateWorkout;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;
using Herculean.Training.Domain.Workouts;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Training.UnitTests.Application.Workouts.CreateWorkout;

public sealed class CreateWorkoutHandlerTests
{
    // Tuesday 3 November 2026, at noon in Zagreb.
    private static readonly DateOnly Today = new(2026, 11, 3);
    private static readonly DateOnly LongAgo = new(2026, 1, 1);

    private readonly RoutineId _legs = RoutineId.New();
    private readonly FakeDayReadRepository _dayReadRepository = new();
    private readonly FakeWorkoutRepository _workoutRepository = new();
    private readonly FakeWorkoutReadRepository _workoutReadRepository = new();
    private readonly FakeTimeProvider _time = new(new DateTimeOffset(2026, 11, 3, 11, 0, 0, TimeSpan.Zero));
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly CreateWorkoutHandler _handler;

    public CreateWorkoutHandlerTests()
    {
        _handler = new CreateWorkoutHandler(
            new CreateWorkoutValidator(),
            _workoutRepository,
            _workoutReadRepository,
            _dayReadRepository,
            new UserClock(new CurrentUser(new FakeCurrentUserAccessor()), new FakeGetUserTimeZone(), _time),
            new CurrentUser(new FakeCurrentUserAccessor()),
            _unitOfWork,
            _time);
    }

    private void Plan(Weekday weekday)
    {
        _dayReadRepository.Changes.Add(new PlanChange(weekday, LongAgo, _legs, "Legs", null));
    }

    private Task<Result<WorkoutResponse>> SkipAsync(DateOnly date) =>
        _handler.HandleAsync(new CreateWorkoutRequest(date, WorkoutStatus.Skipped), TestContext.Current.CancellationToken);

    private Task<Result<WorkoutResponse>> StartAsync(DateOnly date) =>
        _handler.HandleAsync(new CreateWorkoutRequest(date, WorkoutStatus.InProgress), TestContext.Current.CancellationToken);

    private ExerciseId AddExercise(int targetSets = 3, int targetRepsFrom = 8)
    {
        ExerciseId id = ExerciseId.New();
        _workoutReadRepository.RoutineExercises.Add(new RoutineExerciseValues(id, targetSets, targetRepsFrom, 10));

        return id;
    }

    [Fact]
    public async Task StartingTodayAddsAWorkoutInProgressWithTheTimeItStarted()
    {
        Plan(Weekday.Tuesday);
        AddExercise();

        Result<WorkoutResponse> result = await StartAsync(Today);

        result.Value.Status.ShouldBe(WorkoutStatus.InProgress);
        result.Value.Name.ShouldBe("Legs");
        Workout workout = _workoutRepository.Workouts.ShouldHaveSingleItem();
        workout.StartedAtUtc.ShouldBe(_time.GetUtcNow());
        workout.FinishedAtUtc.ShouldBeNull();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task StartingAPastDayHasNoElapsedTime()
    {
        Plan(Weekday.Monday);
        AddExercise();

        await StartAsync(Today.AddDays(-1));

        _workoutRepository.Workouts.ShouldHaveSingleItem().StartedAtUtc.ShouldBeNull();
    }

    [Fact]
    public async Task StartingWithNoLastTimeUsesZeroAndTheLowEndOfTheTarget()
    {
        Plan(Weekday.Tuesday);
        AddExercise(targetSets: 2, targetRepsFrom: 6);

        await StartAsync(Today);

        IReadOnlyList<Set> sets = _workoutRepository.Workouts[0].Exercises[0].Sets;
        sets.Select(set => (set.Order, set.WeightKg, set.Reps, set.Checked)).ShouldBe([(0, 0m, 6, false), (1, 0m, 6, false)]);
    }

    [Fact]
    public async Task StartingCopiesLastTime()
    {
        Plan(Weekday.Tuesday);
        ExerciseId squat = AddExercise(targetSets: 2);
        _workoutReadRepository.LastTime[squat] = new LastTimeResponse(Today.AddDays(-7), [new LastTimeSetResponse(100, 9), new LastTimeSetResponse(90, 7)]);

        await StartAsync(Today);

        _workoutRepository.Workouts[0].Exercises[0].Sets.Select(set => (set.WeightKg, set.Reps)).ShouldBe([(100m, 9), (90m, 7)]);
    }

    [Fact]
    public async Task StartingWithMoreSetsThanLastTimeRepeatsItsLastSet()
    {
        Plan(Weekday.Tuesday);
        ExerciseId squat = AddExercise(targetSets: 3);
        _workoutReadRepository.LastTime[squat] = new LastTimeResponse(Today.AddDays(-7), [new LastTimeSetResponse(100, 9), new LastTimeSetResponse(90, 7)]);

        await StartAsync(Today);

        _workoutRepository.Workouts[0].Exercises[0].Sets.Select(set => (set.WeightKg, set.Reps)).ShouldBe([(100m, 9), (90m, 7), (90m, 7)]);
    }

    [Fact]
    public async Task StartingWithAnotherWorkoutInProgressFails()
    {
        Plan(Weekday.Monday);
        Plan(Weekday.Tuesday);
        AddExercise();
        await StartAsync(Today.AddDays(-1));

        Result<WorkoutResponse> result = await StartAsync(Today);

        result.Error.ShouldBe(WorkoutErrors.AnotherInProgress);
        _workoutRepository.Workouts.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task SkippingIsAllowedWithAnotherWorkoutInProgress()
    {
        Plan(Weekday.Monday);
        Plan(Weekday.Tuesday);
        AddExercise();
        await StartAsync(Today.AddDays(-1));

        Result<WorkoutResponse> result = await SkipAsync(Today);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task StartingARoutineWithNoExercisesLeftFails()
    {
        Plan(Weekday.Tuesday);

        Result<WorkoutResponse> result = await StartAsync(Today);

        result.Error.ShouldBe(WorkoutErrors.NoExercises);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AWorkoutCanNotBeCreatedCompleted()
    {
        Plan(Weekday.Tuesday);

        Result<WorkoutResponse> result = await _handler.HandleAsync(new CreateWorkoutRequest(Today, WorkoutStatus.Completed), TestContext.Current.CancellationToken);

        result.Error!.Code.ShouldBe("validation");
    }

    [Fact]
    public async Task SkippingTodayAddsASkippedWorkoutWithTheRoutinesName()
    {
        Plan(Weekday.Tuesday);

        Result<WorkoutResponse> result = await SkipAsync(Today);

        result.Value.Date.ShouldBe(Today);
        result.Value.Status.ShouldBe(WorkoutStatus.Skipped);
        result.Value.Name.ShouldBe("Legs");
        Workout workout = _workoutRepository.Workouts.ShouldHaveSingleItem();
        workout.RoutineId.ShouldBe(_legs);
        workout.Id.Value.ShouldBe(result.Value.Id);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task SkippingCopiesTheRoutinesExercisesAndTargets()
    {
        Plan(Weekday.Tuesday);
        Guid squat = Guid.CreateVersion7();
        Guid lunge = Guid.CreateVersion7();
        _dayReadRepository.Exercises.Add(new DayExerciseResponse(squat, "Squat", Guid.CreateVersion7(), "Legs", 3, 8, 10));
        _dayReadRepository.Exercises.Add(new DayExerciseResponse(lunge, "Lunge", Guid.CreateVersion7(), "Legs", 4, 6, 6));

        await SkipAsync(Today);

        Workout workout = _workoutRepository.Workouts.ShouldHaveSingleItem();
        workout.Exercises.Count.ShouldBe(2);
        WorkoutExercise first = workout.Exercises[0];
        first.ExerciseId.Value.ShouldBe(squat);
        first.WorkoutId.ShouldBe(workout.Id);
        first.Order.ShouldBe(0);
        first.TargetSets.ShouldBe(3);
        first.TargetRepsFrom.ShouldBe(8);
        first.TargetRepsTo.ShouldBe(10);
        workout.Exercises[1].ExerciseId.Value.ShouldBe(lunge);
        workout.Exercises[1].Order.ShouldBe(1);
    }

    [Fact]
    public async Task APastDayCanBeSkipped()
    {
        Plan(Weekday.Monday);

        Result<WorkoutResponse> result = await SkipAsync(Today.AddDays(-1));

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task ALaterDayCanNotBeSkipped()
    {
        Plan(Weekday.Wednesday);

        Result<WorkoutResponse> result = await SkipAsync(Today.AddDays(1));

        result.Error.ShouldBe(WorkoutErrors.DateInTheFuture);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task ARestDayCanNotBeSkipped()
    {
        Result<WorkoutResponse> result = await SkipAsync(Today);

        result.Error.ShouldBe(WorkoutErrors.NothingPlanned);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task ADayWithAWorkoutCanNotBeSkipped()
    {
        Plan(Weekday.Tuesday);
        await SkipAsync(Today);

        Result<WorkoutResponse> result = await SkipAsync(Today);

        result.Error.ShouldBe(WorkoutErrors.DateTaken);
        _workoutRepository.Workouts.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task ADayCanBeSkippedAgainAfterAnUndo()
    {
        Plan(Weekday.Tuesday);
        await SkipAsync(Today);
        _workoutRepository.Workouts[0].Delete(DateTimeOffset.UtcNow);

        Result<WorkoutResponse> result = await SkipAsync(Today);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task AMissingDateIsNotValid()
    {
        Result<WorkoutResponse> result = await SkipAsync(default);

        result.IsSuccess.ShouldBeFalse();
        result.Error.Code.ShouldBe("validation");
    }
}
