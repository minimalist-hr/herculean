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

        Exercise exercise = Exercise.Create(userId, "  Pull-up ", groupId, []);

        exercise.UserId.ShouldBe(userId);
        exercise.Name.ShouldBe("Pull-up");
        exercise.NormalizedName.ShouldBe("pull-up");
        exercise.GroupId.ShouldBe(groupId);
        exercise.AlsoWorks.ShouldBeEmpty();
        exercise.DeletedAtUtc.ShouldBeNull();
    }

    [Fact]
    public void AlsoWorksKeepsItsGroupsAndBelongsToTheExercisesUser()
    {
        UserId userId = UserId.From(Guid.CreateVersion7());
        GroupId alsoWorksGroupId = GroupId.New();

        Exercise exercise = Exercise.Create(userId, "Pull-up", GroupId.New(), [alsoWorksGroupId]);

        ExerciseAlsoWorks alsoWorks = exercise.AlsoWorks.ShouldHaveSingleItem();
        alsoWorks.GroupId.ShouldBe(alsoWorksGroupId);
        alsoWorks.ExerciseId.ShouldBe(exercise.Id);
        alsoWorks.UserId.ShouldBe(userId);
    }

    [Theory]
    [InlineData("Bench Press")]
    [InlineData(" bench press  ")]
    [InlineData("BENCH PRESS")]
    public void ANameInAnyCaseNormalizesTheSame(string name)
    {
        Exercise.NormalizeName(name).ShouldBe("bench press");
    }

    [Fact]
    public void ANameWithAccentsNormalizesToo()
    {
        Exercise.NormalizeName("ČUČANJ").ShouldBe("čučanj");
    }
}
