using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Days;
using Herculean.Training.Application.Days.GetDay;
using Herculean.Training.Application.Days.GetMonthSummary;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;
using Herculean.Training.Domain.Workouts;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Training.UnitTests.Application.Days.GetMonthSummary;

public sealed class GetMonthSummaryHandlerTests
{
    // Tuesday 3 November 2026, at noon in Zagreb. 2 November is the month's first Monday.
    private static readonly DateOnly Today = new(2026, 11, 3);
    private static readonly DateOnly LongAgo = new(2026, 1, 1);

    private readonly FakeDayReadRepository _dayReadRepository = new();
    private readonly GetMonthSummaryHandler _handler;

    public GetMonthSummaryHandlerTests()
    {
        FakeTimeProvider time = new(new DateTimeOffset(2026, 11, 3, 11, 0, 0, TimeSpan.Zero));
        _handler = new GetMonthSummaryHandler(
            new GetMonthSummaryValidator(),
            _dayReadRepository,
            new UserClock(new CurrentUser(new FakeCurrentUserAccessor()), new FakeGetUserTimeZone(), time));
    }

    private Task<Result<MonthSummaryResponse>> GetAsync(string month) =>
        _handler.HandleAsync(new GetMonthSummaryRequest(month), TestContext.Current.CancellationToken);

    private static DayExerciseResponse Exercise(int targetSets) =>
        new(Guid.CreateVersion7(), "Squat", Guid.CreateVersion7(), "Legs", targetSets, 8, 10);

    [Fact]
    public async Task CountsPastPlannedDaysAsMissed()
    {
        _dayReadRepository.Changes.Add(new PlanChange(Weekday.Monday, LongAgo, RoutineId.New(), "Legs", null));
        _dayReadRepository.Exercises.Add(Exercise(3));
        _dayReadRepository.Exercises.Add(Exercise(2));

        Result<MonthSummaryResponse> result = await GetAsync("2026-11");

        result.Value.ShouldBe(new MonthSummaryResponse(0, 1, 0, 0, 0, 5, 0, 1, 0));
    }

    [Fact]
    public async Task CountsThePlanPerDayAcrossAPastMonth()
    {
        _dayReadRepository.Changes.Add(new PlanChange(Weekday.Monday, LongAgo, RoutineId.New(), "Legs", null));
        _dayReadRepository.Exercises.Add(Exercise(3));

        Result<MonthSummaryResponse> result = await GetAsync("2026-10");

        result.Value.Missed.ShouldBe(4);
        result.Value.SetsPlanned.ShouldBe(12);
    }

    [Fact]
    public async Task TodayCountsOnlyOnceSkipped()
    {
        _dayReadRepository.Changes.Add(new PlanChange(Weekday.Tuesday, LongAgo, RoutineId.New(), "Arms", null));

        (await GetAsync("2026-11")).Value.PlannedDays.ShouldBe(0);

        _dayReadRepository.Workouts.Add(new DayWorkout(Guid.CreateVersion7(), Today, WorkoutStatus.Skipped, "Arms", RoutineId.New()));
        _dayReadRepository.WorkoutExercises.Add(Exercise(4));

        Result<MonthSummaryResponse> result = await GetAsync("2026-11");

        result.Value.ShouldBe(new MonthSummaryResponse(0, 0, 1, 0, 0, 4, 0, 1, 0));
    }

    [Fact]
    public async Task ASkippedDayIsNotAlsoMissed()
    {
        _dayReadRepository.Changes.Add(new PlanChange(Weekday.Monday, LongAgo, RoutineId.New(), "Legs", null));
        _dayReadRepository.Workouts.Add(new DayWorkout(Guid.CreateVersion7(), Today.AddDays(-1), WorkoutStatus.Skipped, "Legs", RoutineId.New()));

        Result<MonthSummaryResponse> result = await GetAsync("2026-11");

        result.Value.Missed.ShouldBe(0);
        result.Value.Skipped.ShouldBe(1);
    }

    [Fact]
    public async Task AWorkoutInProgressCountsTowardsNothing()
    {
        _dayReadRepository.Changes.Add(new PlanChange(Weekday.Monday, LongAgo, RoutineId.New(), "Legs", null));
        _dayReadRepository.Workouts.Add(new DayWorkout(Guid.CreateVersion7(), Today.AddDays(-1), WorkoutStatus.InProgress, "Legs", RoutineId.New()));

        Result<MonthSummaryResponse> result = await GetAsync("2026-11");

        result.Value.Missed.ShouldBe(0);
        result.Value.Skipped.ShouldBe(0);
        result.Value.PlannedDays.ShouldBe(0);
    }

    [Fact]
    public async Task AFutureMonthHasNothingSoFar()
    {
        _dayReadRepository.Changes.Add(new PlanChange(Weekday.Monday, LongAgo, RoutineId.New(), "Legs", null));

        Result<MonthSummaryResponse> result = await GetAsync("2026-12");

        result.Value.ShouldBe(new MonthSummaryResponse(0, 0, 0, 0, 0, 0, 0, 0, null));
    }

    [Theory]
    [InlineData("2026-13")]
    [InlineData("2026-1")]
    [InlineData("2026-11-01")]
    [InlineData("november")]
    public async Task RejectsAnythingButAMonth(string month)
    {
        Result<MonthSummaryResponse> result = await GetAsync(month);

        result.IsSuccess.ShouldBeFalse();
    }

    [Theory]
    [InlineData(0, 0, null)]
    [InlineData(1, 0, null)]
    [InlineData(0, 6, 0)]
    [InlineData(13, 15, 87)]
    [InlineData(1, 8, 13)]
    [InlineData(5, 4, 100)]
    public void ConsistencyStaysWithinOneHundred(int done, int planned, int? percent)
    {
        Consistency.Percent(done, planned).ShouldBe(percent);
    }
}
