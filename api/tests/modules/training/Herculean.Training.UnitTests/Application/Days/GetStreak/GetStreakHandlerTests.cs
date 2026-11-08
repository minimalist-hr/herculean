using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Days;
using Herculean.Training.Application.Days.GetStreak;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;
using Herculean.Training.Domain.Workouts;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Training.UnitTests.Application.Days.GetStreak;

public sealed class GetStreakHandlerTests
{
    // Wednesday 4 November 2026, at noon in Zagreb. Its week starts on Monday 2 November.
    private static readonly DateOnly ThisMonday = new(2026, 11, 2);

    private readonly FakeDayReadRepository _dayReadRepository = new();
    private readonly GetStreakHandler _handler;

    public GetStreakHandlerTests()
    {
        FakeTimeProvider time = new(new DateTimeOffset(2026, 11, 4, 11, 0, 0, TimeSpan.Zero));
        _handler = new GetStreakHandler(
            _dayReadRepository,
            new UserClock(new CurrentUser(new FakeCurrentUserAccessor()), new FakeGetUserTimeZone(), time));
    }

    private static DateOnly MondayWeeksAgo(int weeks) => ThisMonday.AddDays(-7 * weeks);

    private void PlanMondays(DateOnly from)
    {
        _dayReadRepository.Changes.Add(new PlanChange(Weekday.Monday, from, RoutineId.New(), "Legs", null));
    }

    private void AddWorkout(DateOnly date, WorkoutStatus status = WorkoutStatus.Completed)
    {
        _dayReadRepository.Workouts.Add(new DayWorkout(Guid.CreateVersion7(), date, status, "Legs", null));
    }

    private async Task<int> WeeksAsync() => (await _handler.HandleAsync(TestContext.Current.CancellationToken)).Weeks;

    [Fact]
    public async Task NoPlanIsNoStreak()
    {
        (await WeeksAsync()).ShouldBe(0);
    }

    [Fact]
    public async Task CountsFinishedWeeksWithNothingMissed()
    {
        PlanMondays(MondayWeeksAgo(3));
        AddWorkout(MondayWeeksAgo(3));
        AddWorkout(MondayWeeksAgo(2));
        AddWorkout(MondayWeeksAgo(1));

        (await WeeksAsync()).ShouldBe(3);
    }

    [Fact]
    public async Task AMissedDayEndsTheCount()
    {
        PlanMondays(MondayWeeksAgo(3));
        AddWorkout(MondayWeeksAgo(3));
        AddWorkout(MondayWeeksAgo(1));

        (await WeeksAsync()).ShouldBe(1);
    }

    [Fact]
    public async Task TheBestStreakOutlastsAShorterCurrentOne()
    {
        PlanMondays(MondayWeeksAgo(4));
        AddWorkout(MondayWeeksAgo(4));
        AddWorkout(MondayWeeksAgo(3));
        AddWorkout(MondayWeeksAgo(1));

        StreakResponse streak = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        streak.ShouldBe(new StreakResponse(1, 2));
    }

    [Fact]
    public async Task ASkippedDayDoesNotBreakIt()
    {
        PlanMondays(MondayWeeksAgo(2));
        AddWorkout(MondayWeeksAgo(2));
        AddWorkout(MondayWeeksAgo(1), WorkoutStatus.Skipped);

        (await WeeksAsync()).ShouldBe(2);
    }

    [Fact]
    public async Task ThisWeekNeitherCountsNorBreaksIt()
    {
        PlanMondays(MondayWeeksAgo(1));
        AddWorkout(MondayWeeksAgo(1));

        (await WeeksAsync()).ShouldBe(1);
    }

    [Fact]
    public async Task AWeekWithNothingPlannedIsPassedOver()
    {
        RoutineId routineId = RoutineId.New();
        _dayReadRepository.Changes.Add(new PlanChange(Weekday.Monday, MondayWeeksAgo(3), routineId, "Legs", null));
        _dayReadRepository.Changes.Add(new PlanChange(Weekday.Monday, MondayWeeksAgo(2), null, null, null));
        _dayReadRepository.Changes.Add(new PlanChange(Weekday.Monday, MondayWeeksAgo(1), routineId, "Legs", null));
        AddWorkout(MondayWeeksAgo(3));
        AddWorkout(MondayWeeksAgo(1));

        (await WeeksAsync()).ShouldBe(2);
    }

    [Fact]
    public async Task APlanStartedThisWeekHasNoStreakYet()
    {
        PlanMondays(ThisMonday);

        (await WeeksAsync()).ShouldBe(0);
    }
}
