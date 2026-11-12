using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Application.Groups.RenameGroup;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.UnitTests.Application.Groups.RenameGroup;

public sealed class RenameGroupHandlerTests
{
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();
    private readonly FakeGroupRepository _groupRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly IReadOnlyList<Group> _groups;

    public RenameGroupHandlerTests()
    {
        _groups = TestGroups.Create(UserId.From(_currentUserAccessor.UserId));
        _groupRepository.AddRange(_groups);
    }

    private static CancellationToken Token => TestContext.Current.CancellationToken;

    private Group Chest => _groups[0];

    private RenameGroupHandler Handler => new(new RenameGroupValidator(), _groupRepository, _unitOfWork);

    [Fact]
    public async Task RenamingSavesTheTrimmedName()
    {
        Result<GroupResponse> result = await Handler.HandleAsync(Chest.Id.Value, new RenameGroupRequest("  Pecs "), Token);

        result.Value.ShouldBe(new GroupResponse(Chest.Id.Value, "Pecs"));
        Chest.NormalizedName.ShouldBe("pecs");
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AGroupCanChangeTheCaseOfItsOwnName()
    {
        Result<GroupResponse> result = await Handler.HandleAsync(Chest.Id.Value, new RenameGroupRequest("CHEST"), Token);

        result.Value.Name.ShouldBe("CHEST");
    }

    [Fact]
    public async Task RenamingToAnotherGroupsNameIsTaken()
    {
        Result<GroupResponse> result = await Handler.HandleAsync(Chest.Id.Value, new RenameGroupRequest("back"), Token);

        result.Error.ShouldBe(GroupErrors.NameTaken);
        Chest.Name.ShouldBe("Chest");
    }

    [Fact]
    public async Task RenamingAnUnknownGroupIsNotFound()
    {
        Result<GroupResponse> result = await Handler.HandleAsync(Guid.CreateVersion7(), new RenameGroupRequest("Pecs"), Token);

        result.Error.ShouldBe(GroupErrors.NotFound);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task ABlankNameFailsWithAFieldError(string name)
    {
        Result<GroupResponse> result = await Handler.HandleAsync(Chest.Id.Value, new RenameGroupRequest(name), Token);

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("name");
    }

    [Fact]
    public async Task ANameLongerThanThirtyCharactersFailsWithAFieldError()
    {
        Result<GroupResponse> result = await Handler.HandleAsync(Chest.Id.Value, new RenameGroupRequest(new string('a', Group.NameMaxLength + 1)), Token);

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("name");
    }
}
