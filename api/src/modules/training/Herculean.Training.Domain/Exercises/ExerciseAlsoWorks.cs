using Herculean.SharedKernel.Entities;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Domain.Exercises;

internal sealed class ExerciseAlsoWorks : Entity<ExerciseAlsoWorksId>
{
    private ExerciseAlsoWorks(ExerciseAlsoWorksId id, UserId userId, ExerciseId exerciseId, GroupId groupId) : base(id)
    {
        UserId = userId;
        ExerciseId = exerciseId;
        GroupId = groupId;
    }

    public UserId UserId { get; private set; }

    public ExerciseId ExerciseId { get; private set; }

    public GroupId GroupId { get; private set; }

    public Group Group { get; private set; } = null!;

    internal static ExerciseAlsoWorks Create(UserId userId, ExerciseId exerciseId, GroupId groupId) =>
        new(ExerciseAlsoWorksId.New(), userId, exerciseId, groupId);
}
