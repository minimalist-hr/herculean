using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Days;
using Herculean.Training.Application.Days.ListDays;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Training.UnitTests.Application.Days.ListDays;

public sealed class ListDaysHandlerTests
{
    // Tuesday 3 November 2026, at noon in Zagreb.
    private static readonly DateOnly _today = new(2026, 11, 3);

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

        Result<List<DaySummaryResponse>> result = await ListAsync(_today.AddDays(-1), _today.AddDays(1));

        result.Value.ShouldBe(
        [
            new DaySummaryResponse(_today.AddDays(-1), DayStatus.Missed, "Legs"),
            new DaySummaryResponse(_today, DayStatus.Planned, "Arms"),
            new DaySummaryResponse(_today.AddDays(1), DayStatus.Rest, null),
        ]);
    }

    [Fact]
    public async Task ASkippedDayShowsAsSkippedWithTheWorkoutsName()
    {
        _dayReadRepository.Changes.Add(new PlanChange(Weekday.Tuesday, new DateOnly(2026, 1, 1), RoutineId.New(), "Renamed since", null));
        _dayReadRepository.Workouts.Add(new DayWorkout(Guid.CreateVersion7(), _today, "Legs", RoutineId.New()));

        Result<List<DaySummaryResponse>> result = await ListAsync(_today, _today);

        result.Value.ShouldHaveSingleItem().ShouldBe(new DaySummaryResponse(_today, DayStatus.Skipped, "Legs"));
    }

    [Fact]
    public async Task ListsOneDay()
    {
        Result<List<DaySummaryResponse>> result = await ListAsync(_today, _today);

        result.Value.ShouldHaveSingleItem().Date.ShouldBe(_today);
    }

    [Fact]
    public async Task ListsTheMostDays()
    {
        Result<List<DaySummaryResponse>> result = await ListAsync(_today, _today.AddDays(ListDaysValidator.MaxDays - 1));

        result.Value.Count.ShouldBe(ListDaysValidator.MaxDays);
    }

    [Fact]
    public async Task RejectsALastDateBeforeTheFirst()
    {
        Result<List<DaySummaryResponse>> result = await ListAsync(_today, _today.AddDays(-1));

        result.IsSuccess.ShouldBeFalse();
    }

    [Fact]
    public async Task RejectsTooManyDays()
    {
        Result<List<DaySummaryResponse>> result = await ListAsync(_today, _today.AddDays(ListDaysValidator.MaxDays));

        result.IsSuccess.ShouldBeFalse();
    }
}
