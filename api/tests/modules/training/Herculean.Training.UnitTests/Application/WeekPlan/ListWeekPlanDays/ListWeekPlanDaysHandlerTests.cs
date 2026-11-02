using Herculean.Training.Application.WeekPlan.ListWeekPlanDays;
using Herculean.Training.Domain.WeekPlan;

namespace Herculean.Training.UnitTests.Application.WeekPlan.ListWeekPlanDays;

public sealed class ListWeekPlanDaysHandlerTests
{
    [Fact]
    public async Task ReadsThemFromTheRepository()
    {
        FakeWeekPlanReadRepository repository = new();
        WeekPlanDayResponse item = new(Weekday.Monday, null, null);
        repository.Items.Add(item);

        List<WeekPlanDayResponse> items = await new ListWeekPlanDaysHandler(repository).HandleAsync(TestContext.Current.CancellationToken);

        items.ShouldHaveSingleItem().ShouldBe(item);
    }
}
