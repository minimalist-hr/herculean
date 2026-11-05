using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Days;
using Herculean.Training.Application.Days.ListDays;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;
using Herculean.Training.Domain.Workouts;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Training.UnitTests.Application.Days.ListDays;

public sealed class ListDaysHandlerTests
{
    // Tuesday 3 November 2026, at noon in Zagreb.
    private static readonly DateOnly Today = new(2026, 11, 3);

    private readonly FakeDayReadRepository _dayReadRepository = new();
    private readonly ListDaysHandler _handler;

    public ListDaysHandlerTests()
    {
        FakeTimeProvider time = new(new DateTimeOffset(2026, 11, 3, 11, 0, 0, TimeSpan.Zero));
        _handler = new ListDaysHandler(
            new ListDaysValidator(),
            _dayReadRepository,
            new UserClock(new CurrentUser(new FakeCurrentUserAccessor()), new FakeGetUserTimeZone(), time));
    }

    private Task<Result<List<DaySummaryResponse>>> ListAsync(DateOnly from, DateOnly to) =>
        _handler.HandleAsync(new ListDaysRequest(from, to), TestContext.Current.CancellationToken);

    [Fact]
    public async Task ListsEachDateWithItsStatus()
    {
        DateOnly longAgo = new(2026, 1, 1);
        _dayReadRepository.Changes.Add(new PlanChange(Weekday.Monday, longAgo, RoutineId.New(), "Legs", null));
        _dayReadRepository.Changes.Add(new PlanChange(Weekday.Tuesday, longAgo, RoutineId.New(), "Arms", null));

        Result<List<DaySummaryResponse>> result = await ListAsync(Today.AddDays(-1), Today.AddDays(1));

        result.Value.ShouldBe(
        [
            new DaySummaryResponse(Today.AddDays(-1), DayStatus.Missed, "Legs"),
            new DaySummaryResponse(Today, DayStatus.Planned, "Arms"),
            new DaySummaryResponse(Today.AddDays(1), DayStatus.Rest, null),
        ]);
    }

    [Fact]
    public async Task ASkippedDayShowsAsSkippedWithTheWorkoutsName()
    {
        _dayReadRepository.Changes.Add(new PlanChange(Weekday.Tuesday, new DateOnly(2026, 1, 1), RoutineId.New(), "Renamed since", null));
        _dayReadRepository.Workouts.Add(new DayWorkout(Guid.CreateVersion7(), Today, WorkoutStatus.Skipped, "Legs", RoutineId.New()));

        Result<List<DaySummaryResponse>> result = await ListAsync(Today, Today);

        result.Value.ShouldHaveSingleItem().ShouldBe(new DaySummaryResponse(Today, DayStatus.Skipped, "Legs"));
    }

    [Fact]
    public async Task ADayInProgressShowsAsInProgress()
    {
        _dayReadRepository.Workouts.Add(new DayWorkout(Guid.CreateVersion7(), Today, WorkoutStatus.InProgress, "Legs", RoutineId.New()));

        Result<List<DaySummaryResponse>> result = await ListAsync(Today, Today);

        result.Value.ShouldHaveSingleItem().ShouldBe(new DaySummaryResponse(Today, DayStatus.InProgress, "Legs"));
    }

    [Fact]
    public async Task ListsOneDay()
    {
        Result<List<DaySummaryResponse>> result = await ListAsync(Today, Today);

        result.Value.ShouldHaveSingleItem().Date.ShouldBe(Today);
    }

    [Fact]
    public async Task ListsTheMostDays()
    {
        Result<List<DaySummaryResponse>> result = await ListAsync(Today, Today.AddDays(ListDaysValidator.MaxDays - 1));

        result.Value.Count.ShouldBe(ListDaysValidator.MaxDays);
    }

    [Fact]
    public async Task RejectsALastDateBeforeTheFirst()
    {
        Result<List<DaySummaryResponse>> result = await ListAsync(Today, Today.AddDays(-1));

        result.IsSuccess.ShouldBeFalse();
    }

    [Fact]
    public async Task RejectsTooManyDays()
    {
        Result<List<DaySummaryResponse>> result = await ListAsync(Today, Today.AddDays(ListDaysValidator.MaxDays));

        result.IsSuccess.ShouldBeFalse();
    }
}
