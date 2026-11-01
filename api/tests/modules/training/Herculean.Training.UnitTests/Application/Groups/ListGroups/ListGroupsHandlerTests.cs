using Herculean.Training.Application.Groups.ListGroups;

namespace Herculean.Training.UnitTests.Application.Groups.ListGroups;

public sealed class ListGroupsHandlerTests
{
    [Fact]
    public async Task ReadsTheGroups()
    {
        FakeGroupReadRepository groupReadRepository = new();
        GroupListItemResponse group = new(Guid.CreateVersion7(), "Chest", 0);
        groupReadRepository.Groups.Add(group);
        ListGroupsHandler handler = new(groupReadRepository);

        List<GroupListItemResponse> groups = await handler.HandleAsync(TestContext.Current.CancellationToken);

        groups.ShouldHaveSingleItem().ShouldBe(group);
    }
}
