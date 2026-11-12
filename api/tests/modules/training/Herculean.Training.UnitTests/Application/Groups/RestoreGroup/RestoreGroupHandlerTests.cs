using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Application.Groups.RestoreGroup;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.UnitTests.Application.Groups.RestoreGroup;

public sealed class RestoreGroupHandlerTests
{
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();
    private readonly FakeGroupRepository _groupRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly IReadOnlyList<Group> _groups;

    public RestoreGroupHandlerTests()
    {
        _groups = TestGroups.Create(UserId.From(_currentUserAccessor.UserId));
        _groupRepository.AddRange(_groups);
    }

    private static CancellationToken Token => TestContext.Current.CancellationToken;

    private Group Chest => _groups[0];

    private RestoreGroupHandler Handler => new(_groupRepository, _unitOfWork);

    [Fact]
    public async Task RestoringBringsADeletedGroupBack()
    {
        Chest.Delete(DateTimeOffset.UnixEpoch);

        Result<GroupResponse> result = await Handler.HandleAsync(Chest.Id.Value, Token);

        result.Value.ShouldBe(new GroupResponse(Chest.Id.Value, "Chest"));
        Chest.DeletedAtUtc.ShouldBeNull();
        Chest.Order.ShouldBe(0);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task RestoringFailsIfItsNameIsNowTaken()
    {
        Chest.Delete(DateTimeOffset.UnixEpoch);
        _groupRepository.Add(Group.Create(UserId.From(_currentUserAccessor.UserId), "chest", 6));

        Result<GroupResponse> result = await Handler.HandleAsync(Chest.Id.Value, Token);

        result.Error.ShouldBe(GroupErrors.NameTaken);
        Chest.DeletedAtUtc.ShouldNotBeNull();
    }

    [Fact]
    public async Task RestoringAGroupThatIsNotDeletedIsNotFound()
    {
        Result<GroupResponse> result = await Handler.HandleAsync(Chest.Id.Value, Token);

        result.Error.ShouldBe(GroupErrors.NotFound);
    }
}
