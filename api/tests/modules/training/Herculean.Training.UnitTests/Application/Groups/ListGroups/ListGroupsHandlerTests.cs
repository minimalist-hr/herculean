using Herculean.Training.Application.Groups.ListGroups;

namespace Herculean.Training.UnitTests.Application.Groups.ListGroups;

public sealed class ListGroupsHandlerTests
{
    [Fact]
    public async Task ReadsTheGroups()
    {
        FakeGroupReadRepository groupReadRepository = new();
        GroupResponse group = new(Guid.CreateVersion7(), "Chest");
        groupReadRepository.Groups.Add(group);
        ListGroupsHandler handler = new(groupReadRepository);

        List<GroupResponse> groups = await handler.HandleAsync(TestContext.Current.CancellationToken);

        groups.ShouldHaveSingleItem().ShouldBe(group);
    }
}
