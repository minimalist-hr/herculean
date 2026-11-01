using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Groups.UpdateGroupOrder;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.UnitTests.Application.Groups.UpdateGroupOrder;

public sealed class UpdateGroupOrderHandlerTests
{
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();
    private readonly FakeGroupRepository _groupRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly IReadOnlyList<Group> _groups;

    public UpdateGroupOrderHandlerTests()
    {
        _groups = Group.CreateStarting(UserId.From(_currentUserAccessor.UserId));
        _groupRepository.AddRange(_groups);
    }

    private static CancellationToken Token => TestContext.Current.CancellationToken;

    private Group Chest => _groups[0];

    private UpdateGroupOrderHandler Handler => new(new UpdateGroupOrderValidator(), _groupRepository, _unitOfWork);

    [Fact]
    public async Task TheOrderFollowsTheList()
    {
        List<Guid> reversed = [.. _groups.Reverse().Select(group => group.Id.Value)];

        Result result = await Handler.HandleAsync(new UpdateGroupOrderRequest(reversed), Token);

        result.IsSuccess.ShouldBeTrue();
        _groups[5].Order.ShouldBe(0);
        Chest.Order.ShouldBe(5);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AnOrderMissingAGroupIsAConflict()
    {
        List<Guid> missing = [.. _groups.Skip(1).Select(group => group.Id.Value)];

        Result result = await Handler.HandleAsync(new UpdateGroupOrderRequest(missing), Token);

        result.Error.ShouldBe(GroupErrors.OrderOutOfDate);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AnOrderWithAnUnknownGroupIsAConflict()
    {
        List<Guid> unknown = [.. _groups.Skip(1).Select(group => group.Id.Value), Guid.CreateVersion7()];

        Result result = await Handler.HandleAsync(new UpdateGroupOrderRequest(unknown), Token);

        result.Error.ShouldBe(GroupErrors.OrderOutOfDate);
    }

    [Fact]
    public async Task AnOrderRepeatingAGroupFailsWithAFieldError()
    {
        List<Guid> repeated = [Chest.Id.Value, Chest.Id.Value];

        Result result = await Handler.HandleAsync(new UpdateGroupOrderRequest(repeated), Token);

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("groupIds");
    }
}
