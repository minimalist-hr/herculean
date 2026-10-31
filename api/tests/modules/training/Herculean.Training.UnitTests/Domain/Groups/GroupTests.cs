using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.UnitTests.Domain.Groups;

public sealed class GroupTests
{
    [Fact]
    public void StartingGroupsAreTheSixInOrder()
    {
        UserId userId = UserId.From(Guid.CreateVersion7());

        IReadOnlyList<Group> groups = Group.CreateStarting(userId);

        groups.Select(group => group.Name).ShouldBe(["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs"]);
        groups.Select(group => group.Order).ShouldBe([0, 1, 2, 3, 4, 5]);
        groups.ShouldAllBe(group => group.UserId == userId && group.DeletedAtUtc == null);
    }
}
