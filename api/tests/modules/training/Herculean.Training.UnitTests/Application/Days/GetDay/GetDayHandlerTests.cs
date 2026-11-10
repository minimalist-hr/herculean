using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Days;
using Herculean.Training.Application.Days.GetDay;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;
using Herculean.Training.Domain.Workouts;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Training.UnitTests.Application.Days.GetDay;

public sealed class GetDayHandlerTests
{
    // Tuesday 3 November 2026, at noon in Zagreb.
    private static readonly DateOnly Today = new(2026, 11, 3);
    private static readonly DateOnly LongAgo = new(2026, 1, 1);

    private readonly FakeDayReadRepository _dayReadRepository = new();
    private readonly GetDayHandler _handler;

    public GetDayHandlerTests()
    {
        FakeTimeProvider time = new(new DateTimeOffset(2026, 11, 3, 11, 0, 0, TimeSpan.Zero));
        _handler = new GetDayHandler(
            _dayReadRepository,
            new UserClock(new CurrentUser(new FakeCurrentUserAccessor()), new FakeGetUserTimeZone(), time));
    }

    private void Plan(Weekday weekday, string? name, DateOnly? from = null, DateTimeOffset? deletedAtUtc = null)
    {
        _dayReadRepository.Changes.Add(new PlanChange(weekday, from ?? LongAgo, name is null ? null : RoutineId.New(), name, deletedAtUtc));
    }

    private Task<DayResponse> GetAsync(DateOnly date) => _handler.HandleAsync(date, TestContext.Current.CancellationToken);

    [Fact]
    public async Task TodayWithARoutineIsPlanned()
    {
        Plan(Weekday.Tuesday, "Legs");
        DayExerciseResponse squat = new(Guid.CreateVersion7(), "Squat", Guid.CreateVersion7(), "Legs", 3, 8, 10, true);
        _dayReadRepository.Exercises.Add(squat);

        DayResponse day = await GetAsync(Today);

        day.Date.ShouldBe(Today);
        day.Status.ShouldBe(DayStatus.Planned);
        day.Routine.ShouldNotBeNull().Name.ShouldBe("Legs");
        day.Routine.Exercises.ShouldHaveSingleItem().ShouldBe(squat);
    }

    [Fact]
    public async Task APastDayWithARoutineIsMissed()
    {
        Plan(Weekday.Monday, "Legs");

        DayResponse day = await GetAsync(Today.AddDays(-1));

        day.Status.ShouldBe(DayStatus.Missed);
    }

    [Fact]
    public async Task ALaterDayWithARoutineIsPlanned()
    {
        Plan(Weekday.Wednesday, "Legs");

        DayResponse day = await GetAsync(Today.AddDays(1));

        day.Status.ShouldBe(DayStatus.Planned);
    }

    [Fact]
    public async Task ADayWithNoRoutineIsARestDay()
    {
        DayResponse day = await GetAsync(Today);

        day.Status.ShouldBe(DayStatus.Rest);
        day.Routine.ShouldBeNull();
    }

    [Fact]
    public async Task ADayWhoseRoutineWasTakenOffIsARestDay()
    {
        Plan(Weekday.Tuesday, "Legs");
        Plan(Weekday.Tuesday, null, Today);

        DayResponse day = await GetAsync(Today);

        day.Status.ShouldBe(DayStatus.Rest);
    }

    [Fact]
    public async Task APastDayKeepsThePlanItHad()
    {
        Plan(Weekday.Monday, "Legs");
        Plan(Weekday.Monday, "Arms", Today);

        DayResponse day = await GetAsync(Today.AddDays(-1));

        day.Routine.ShouldNotBeNull().Name.ShouldBe("Legs");
    }

    [Fact]
    public async Task ADayBeforeTheRoutineWasPlannedIsARestDay()
    {
        Plan(Weekday.Monday, "Legs", Today);

        DayResponse day = await GetAsync(Today.AddDays(-1));

        day.Status.ShouldBe(DayStatus.Rest);
    }

    [Fact]
    public async Task ADeletedRoutineLeavesRestDaysFromTheDateItWasDeleted()
    {
        // 23:30 UTC on 2 November is already 3 November in Zagreb.
        Plan(Weekday.Tuesday, "Legs", deletedAtUtc: new DateTimeOffset(2026, 11, 2, 23, 30, 0, TimeSpan.Zero));

        DayResponse day = await GetAsync(Today);

        day.Status.ShouldBe(DayStatus.Rest);
    }

    [Fact]
    public async Task ADeletedRoutineKeepsEarlierDaysAsPlanned()
    {
        Plan(Weekday.Tuesday, "Legs", deletedAtUtc: new DateTimeOffset(2026, 11, 3, 11, 0, 0, TimeSpan.Zero));

        DayResponse day = await GetAsync(Today.AddDays(-7));

        day.Status.ShouldBe(DayStatus.Missed);
        day.Routine.ShouldNotBeNull().Name.ShouldBe("Legs");
    }

    [Fact]
    public async Task ASkippedDayShowsTheWorkoutsNameAndExercises()
    {
        Plan(Weekday.Tuesday, "Renamed since");
        DayExerciseResponse squat = new(Guid.CreateVersion7(), "Squat", Guid.CreateVersion7(), "Legs", 3, 8, 10, true);
        DayExerciseResponse addedSince = new(Guid.CreateVersion7(), "Lunge", Guid.CreateVersion7(), "Legs", 4, 6, 6, true);
        _dayReadRepository.WorkoutExercises.Add(squat);
        _dayReadRepository.Exercises.Add(addedSince);
        Guid workoutId = Guid.CreateVersion7();
        _dayReadRepository.Workouts.Add(new DayWorkout(workoutId, Today, WorkoutStatus.Skipped, "Legs", RoutineId.New()));

        DayResponse day = await GetAsync(Today);

        day.Status.ShouldBe(DayStatus.Skipped);
        day.WorkoutId.ShouldBe(workoutId);
        day.Routine.ShouldNotBeNull().Name.ShouldBe("Legs");
        day.Routine.Exercises.ShouldHaveSingleItem().ShouldBe(squat);
    }

    [Theory]
    [InlineData(WorkoutStatus.InProgress, DayStatus.InProgress)]
    [InlineData(WorkoutStatus.Completed, DayStatus.Completed)]
    internal async Task ADayShowsItsWorkoutsStatus(WorkoutStatus status, DayStatus expected)
    {
        Guid workoutId = Guid.CreateVersion7();
        _dayReadRepository.Workouts.Add(new DayWorkout(workoutId, Today, status, "Legs", RoutineId.New()));

        DayResponse day = await GetAsync(Today);

        day.Status.ShouldBe(expected);
        day.WorkoutId.ShouldBe(workoutId);
    }

    [Fact]
    public async Task ASkippedDayStaysSkippedAfterItsRoutineLeavesThePlan()
    {
        Plan(Weekday.Tuesday, null);
        _dayReadRepository.Workouts.Add(new DayWorkout(Guid.CreateVersion7(), Today, WorkoutStatus.Skipped, "Legs", RoutineId.New()));

        DayResponse day = await GetAsync(Today);

        day.Status.ShouldBe(DayStatus.Skipped);
        day.Routine.ShouldNotBeNull().Name.ShouldBe("Legs");
    }

    [Fact]
    public async Task ADayWithNoWorkoutHasNoWorkoutId()
    {
        Plan(Weekday.Tuesday, "Legs");

        DayResponse day = await GetAsync(Today);

        day.WorkoutId.ShouldBeNull();
    }

    [Fact]
    public async Task APlannedRoutineExists()
    {
        Plan(Weekday.Tuesday, "Legs");

        DayResponse day = await GetAsync(Today);

        day.Routine.ShouldNotBeNull().Exists.ShouldBeTrue();
    }

    [Fact]
    public async Task ADoneDaysRoutineDoesNotExistOnceDeleted()
    {
        RoutineId legs = RoutineId.New();
        _dayReadRepository.Workouts.Add(new DayWorkout(Guid.CreateVersion7(), Today, WorkoutStatus.Completed, "Legs", legs));
        _dayReadRepository.DeletedRoutines.Add(legs);

        DayResponse day = await GetAsync(Today);

        day.Routine.ShouldNotBeNull().Exists.ShouldBeFalse();
    }

    [Fact]
    public async Task UpNextIsTheRoutineOnTheDayAfter()
    {
        Plan(Weekday.Wednesday, "Legs");

        DayResponse day = await GetAsync(Today);

        PlanChange legs = _dayReadRepository.Changes.ShouldHaveSingleItem();
        day.UpNext.ShouldBe(new UpNextResponse(Today.AddDays(1), legs.RoutineId?.Value, "Legs"));
    }

    [Fact]
    public async Task UpNextHasNoRoutineWhenTheDayAfterIsARestDay()
    {
        DayResponse day = await GetAsync(Today);

        day.UpNext.ShouldBe(new UpNextResponse(Today.AddDays(1), null, null));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task SaysWhetherTheUserHasRoutines(bool hasRoutines)
    {
        _dayReadRepository.HasRoutines = hasRoutines;

        DayResponse day = await GetAsync(Today);

        day.HasRoutines.ShouldBe(hasRoutines);
    }
}
