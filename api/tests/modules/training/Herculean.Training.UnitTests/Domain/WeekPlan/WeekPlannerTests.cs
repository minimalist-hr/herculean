using Herculean.Training.Domain;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;
using Herculean.Training.UnitTests.Application;

namespace Herculean.Training.UnitTests.Domain.WeekPlan;

public sealed class WeekPlannerTests
{
    private static readonly DateOnly Today = new(2026, 11, 3);
    private static readonly DateOnly LastMonth = new(2026, 10, 1);

    private readonly UserId _userId = UserId.From(Guid.CreateVersion7());
    private readonly FakeWeekPlanDayRepository _days = new();
    private readonly WeekPlanner _weekPlanner;
    private readonly Routine _legs;
    private readonly RoutineId _push = RoutineId.New();

    public WeekPlannerTests()
    {
        _legs = Routine.Create(_userId, "Legs", []);
        _weekPlanner = new WeekPlanner(_days);
    }

    [Fact]
    public async Task AFreeDayIsPlannedFromToday()
    {
        List<MovedDay> moved = await PlanLegsAsync(Weekday.Monday);

        moved.ShouldBeEmpty();
        WeekPlanDay day = _days.Days.ShouldHaveSingleItem();
        day.Weekday.ShouldBe(Weekday.Monday);
        day.RoutineId.ShouldBe(_legs.Id);
        day.EffectiveFrom.ShouldBe(Today);
    }

    [Fact]
    public async Task ADayLeftBecomesARestDayAndThePastStays()
    {
        WeekPlanDay monday = AddDay(Weekday.Monday, _legs.Id, LastMonth);

        await PlanLegsAsync();

        monday.RoutineId.ShouldBe(_legs.Id);
        WeekPlanDay rest = _days.Days[1];
        rest.Weekday.ShouldBe(Weekday.Monday);
        rest.RoutineId.ShouldBeNull();
        rest.EffectiveFrom.ShouldBe(Today);
    }

    [Fact]
    public async Task ADayTakenFromAnotherRoutineIsReportedInWeekdayOrder()
    {
        AddDay(Weekday.Thursday, _push, LastMonth);
        AddDay(Weekday.Monday, _push, LastMonth);

        List<MovedDay> moved = await PlanLegsAsync(Weekday.Thursday, Weekday.Monday);

        moved.ShouldBe([new MovedDay(Weekday.Monday, _push), new MovedDay(Weekday.Thursday, _push)]);
        _days.Days.Count.ShouldBe(4);
    }

    [Fact]
    public async Task ADayChangedTodayChangesInPlace()
    {
        WeekPlanDay monday = AddDay(Weekday.Monday, _push, Today);

        await PlanLegsAsync(Weekday.Monday);

        monday.RoutineId.ShouldBe(_legs.Id);
        _days.Days.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task ADayAlreadyOnTheRoutineAndOtherRoutinesDaysStay()
    {
        AddDay(Weekday.Monday, _legs.Id, LastMonth);
        AddDay(Weekday.Tuesday, _push, LastMonth);

        await PlanLegsAsync(Weekday.Monday);

        _days.Days.Count.ShouldBe(2);
    }

    private WeekPlanDay AddDay(Weekday weekday, RoutineId routineId, DateOnly effectiveFrom)
    {
        WeekPlanDay day = WeekPlanDay.Create(_userId, weekday, routineId, effectiveFrom);
        _days.Add(day);

        return day;
    }

    private Task<List<MovedDay>> PlanLegsAsync(params Weekday[] weekdays) =>
        _weekPlanner.PlanRoutineAsync(_legs, weekdays, Today, TestContext.Current.CancellationToken);
}
