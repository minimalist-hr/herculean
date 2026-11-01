using Herculean.SharedKernel.Entities;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Domain.Exercises;

internal sealed class Exercise : Entity<ExerciseId>
{
    private Exercise(ExerciseId id, UserId userId, string name, GroupId groupId) : base(id)
    {
        UserId = userId;
        Name = name;
        GroupId = groupId;
    }

    public UserId UserId { get; private set; }

    public string Name { get; private set; }

    public GroupId GroupId { get; private set; }

    public Group Group { get; private set; } = null!;

    public DateTimeOffset? DeletedAtUtc { get; private set; }

    public static Exercise Create(UserId userId, string name, GroupId groupId) =>
        new(ExerciseId.New(), userId, name.Trim(), groupId);
}
