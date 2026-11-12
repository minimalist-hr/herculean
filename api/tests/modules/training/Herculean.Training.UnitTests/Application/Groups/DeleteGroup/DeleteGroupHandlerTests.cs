using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Groups.DeleteGroup;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.UnitTests.Application.Groups.DeleteGroup;

public sealed class DeleteGroupHandlerTests
{
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();
    private readonly FakeGroupRepository _groupRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly IReadOnlyList<Group> _groups;

    public DeleteGroupHandlerTests()
    {
        _groups = TestGroups.Create(UserId.From(_currentUserAccessor.UserId));
        _groupRepository.AddRange(_groups);
    }

    private static CancellationToken Token => TestContext.Current.CancellationToken;

    private Group Chest => _groups[0];

    private DeleteGroupHandler Handler => new(_groupRepository, _unitOfWork, TimeProvider.System);

    [Fact]
    public async Task AnEmptyGroupIsMarkedDeleted()
    {
        Result result = await Handler.HandleAsync(Chest.Id.Value, Token);

        result.IsSuccess.ShouldBeTrue();
        Chest.DeletedAtUtc.ShouldNotBeNull();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AGroupAnExerciseUsesCannotBeDeleted()
    {
        _groupRepository.UsedGroupIds.Add(Chest.Id);

        Result result = await Handler.HandleAsync(Chest.Id.Value, Token);

        result.Error.ShouldBe(GroupErrors.InUse);
        Chest.DeletedAtUtc.ShouldBeNull();
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task DeletingAnUnknownOrDeletedGroupIsNotFound()
    {
        Chest.Delete(DateTimeOffset.UnixEpoch);

        (await Handler.HandleAsync(Chest.Id.Value, Token)).Error.ShouldBe(GroupErrors.NotFound);
        (await Handler.HandleAsync(Guid.CreateVersion7(), Token)).Error.ShouldBe(GroupErrors.NotFound);
    }
}
