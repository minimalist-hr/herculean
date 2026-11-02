using Herculean.Training.Application.Routines.ListRoutines;
using Herculean.Training.Domain.WeekPlan;

namespace Herculean.Training.UnitTests.Application.Routines.ListRoutines;

public sealed class ListRoutinesHandlerTests
{
    [Fact]
    public async Task ReadsThemFromTheRepository()
    {
        FakeRoutineReadRepository repository = new();
        RoutineListItemResponse item = new(Guid.CreateVersion7(), "Legs", 4, 10, [Weekday.Wednesday]);
        repository.Items.Add(item);

        List<RoutineListItemResponse> items = await new ListRoutinesHandler(repository).HandleAsync(TestContext.Current.CancellationToken);

        items.ShouldHaveSingleItem().ShouldBe(item);
    }
}
