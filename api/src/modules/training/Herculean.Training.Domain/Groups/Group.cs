using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Groups;

internal sealed class Group : Entity<GroupId>
{
    internal static readonly string[] StartingNames = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs"];

    private Group(GroupId id, UserId userId, string name, int order) : base(id)
    {
        UserId = userId;
        Name = name;
        Order = order;
    }

    public UserId UserId { get; private set; }

    public string Name { get; private set; }

    public int Order { get; private set; }

    public DateTimeOffset? DeletedAtUtc { get; private set; }

    /// <summary>The groups a new account starts with, in their order.</summary>
    public static IReadOnlyList<Group> CreateStarting(UserId userId) =>
        [.. StartingNames.Select((name, order) => new Group(GroupId.New(), userId, name, order))];
}
