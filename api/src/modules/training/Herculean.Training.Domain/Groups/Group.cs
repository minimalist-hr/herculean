using Herculean.SharedKernel.Entities;
using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Domain.Groups;

internal sealed class Group : Entity<GroupId>
{
    internal const int NameMaxLength = 30;

    /// <summary>Keeps the chips and the group list small enough to use.</summary>
    internal const int MaxPerUser = 50;

    private readonly List<Exercise> _exercises = [];

    private Group(GroupId id, UserId userId, string name, int order) : base(id)
    {
        UserId = userId;
        Name = name.Trim();
        NormalizedName = NormalizeName(name);
        Order = order;
    }

    public UserId UserId { get; private set; }

    public string Name { get; private set; }

    /// <summary>For finding the name regardless of case. See <see cref="NormalizeName"/>.</summary>
    public string NormalizedName { get; private set; }

    public int Order { get; private set; }

    public DateTimeOffset? DeletedAtUtc { get; private set; }

    public IReadOnlyList<Exercise> Exercises => _exercises;

    public static Group Create(UserId userId, string name, int order) => new(GroupId.New(), userId, name, order);

    public static string NormalizeName(string name) => name.Trim().ToLowerInvariant();

    public void Rename(string name)
    {
        Name = name.Trim();
        NormalizedName = NormalizeName(name);
    }

    public void MoveTo(int order)
    {
        Order = order;
    }

    public void Delete(DateTimeOffset deletedAtUtc)
    {
        DeletedAtUtc = deletedAtUtc;
    }

    public void Restore()
    {
        DeletedAtUtc = null;
    }
}
