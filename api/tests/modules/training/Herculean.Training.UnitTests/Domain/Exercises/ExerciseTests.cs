using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.UnitTests.Domain.Exercises;

public sealed class ExerciseTests
{
    [Fact]
    public void ANewExerciseHasATrimmedNameAndIsNotDeleted()
    {
        UserId userId = UserId.From(Guid.CreateVersion7());
        GroupId groupId = GroupId.New();

        Exercise exercise = Exercise.Create(userId, "  Pull-up ", groupId);

        exercise.UserId.ShouldBe(userId);
        exercise.Name.ShouldBe("Pull-up");
        exercise.GroupId.ShouldBe(groupId);
        exercise.DeletedAtUtc.ShouldBeNull();
    }
}
