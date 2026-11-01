using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Groups.CreateGroup;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.UnitTests.Application.Groups.CreateGroup;

public sealed class CreateGroupHandlerTests
{
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();
    private readonly FakeGroupRepository _groupRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly IReadOnlyList<Group> _groups;

    public CreateGroupHandlerTests()
    {
        _groups = Group.CreateStarting(UserId.From(_currentUserAccessor.UserId));
        _groupRepository.AddRange(_groups);
    }

    private static CancellationToken Token => TestContext.Current.CancellationToken;

    private Group Chest => _groups[0];

    private CreateGroupHandler Handler => new(new CreateGroupValidator(), new CurrentUser(_currentUserAccessor), _groupRepository, _unitOfWork);

    [Fact]
    public async Task ANewGroupIsTrimmedAndGoesLast()
    {
        Result<GroupResponse> result = await Handler.HandleAsync(new CreateGroupRequest("  Core "), Token);

        result.Value.Name.ShouldBe("Core");
        Group group = _groupRepository.Groups.Single(item => item.Id.Value == result.Value.Id);
        group.Order.ShouldBe(_groups.Count);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task ANewGroupGoesAfterADeletedOne()
    {
        _groups[5].Delete(DateTimeOffset.UnixEpoch);

        Result<GroupResponse> result = await Handler.HandleAsync(new CreateGroupRequest("Core"), Token);

        _groupRepository.Groups.Single(item => item.Id.Value == result.Value.Id).Order.ShouldBe(_groups.Count);
    }

    [Theory]
    [InlineData("Chest")]
    [InlineData("CHEST")]
    [InlineData("  chest ")]
    public async Task ANewGroupNameMustBeUniqueInAnyCase(string name)
    {
        Result<GroupResponse> result = await Handler.HandleAsync(new CreateGroupRequest(name), Token);

        result.Error.ShouldBe(GroupErrors.NameTaken);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task ADeletedGroupsNameCanBeUsedAgain()
    {
        Chest.Delete(DateTimeOffset.UnixEpoch);

        Result<GroupResponse> result = await Handler.HandleAsync(new CreateGroupRequest("Chest"), Token);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task AtTheLimitNoGroupIsAdded()
    {
        _groupRepository.Count = Group.MaxPerUser;

        Result<GroupResponse> result = await Handler.HandleAsync(new CreateGroupRequest("Core"), Token);

        result.Error.ShouldBe(GroupErrors.LimitReached);
        result.Error!.Description.ShouldContain("50");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task ABlankNameFailsWithAFieldError(string name)
    {
        Result<GroupResponse> result = await Handler.HandleAsync(new CreateGroupRequest(name), Token);

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("name");
    }

    [Fact]
    public async Task ANameOfThirtyCharactersIsAllowedAndLongerIsNot()
    {
        string longest = new('a', Group.NameMaxLength);

        (await Handler.HandleAsync(new CreateGroupRequest(longest), Token)).IsSuccess.ShouldBeTrue();
        (await Handler.HandleAsync(new CreateGroupRequest(longest + "a"), Token)).Error.ShouldNotBeNull().Fields.ShouldContainKey("name");
    }
}
