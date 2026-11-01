using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Groups.GetGroup;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.UnitTests.Application.Groups.GetGroup;

public sealed class GetGroupHandlerTests
{
    private readonly FakeGroupReadRepository _groupReadRepository = new();
    private readonly GetGroupHandler _handler;

    public GetGroupHandlerTests()
    {
        _handler = new GetGroupHandler(_groupReadRepository);
    }

    [Fact]
    public async Task ReadsTheGroup()
    {
        GroupDetailsResponse group = new(Guid.CreateVersion7(), "Chest", [], []);
        _groupReadRepository.Details.Add(group);

        Result<GroupDetailsResponse> result = await _handler.HandleAsync(group.Id, TestContext.Current.CancellationToken);

        result.Value.ShouldBe(group);
    }

    [Fact]
    public async Task AnUnknownGroupFailsAsNotFound()
    {
        Result<GroupDetailsResponse> result = await _handler.HandleAsync(Guid.CreateVersion7(), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(GroupErrors.NotFound);
    }
}
