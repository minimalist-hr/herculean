using Herculean.Training.Domain.Starter;

namespace Herculean.Training.UnitTests.Domain.Starter;

public sealed class StarterExerciseTests
{
    private readonly StarterGroupId _chest = StarterGroupId.New();
    private readonly StarterGroupId _shoulders = StarterGroupId.New();
    private readonly StarterGroupId _triceps = StarterGroupId.New();

    [Fact]
    public void AStarterExerciseIsTrimmedWithItsGroups()
    {
        StarterExercise exercise = StarterExercise.Create(" Bench press ", _chest, [_triceps]);

        exercise.Name.ShouldBe("Bench press");
        exercise.NormalizedName.ShouldBe("bench press");
        exercise.GroupId.ShouldBe(_chest);
        exercise.AlsoWorks.ShouldHaveSingleItem().GroupId.ShouldBe(_triceps);
    }

    [Fact]
    public void AnUpdateKeepsTheAlsoWorksItStillHas()
    {
        StarterExercise exercise = StarterExercise.Create("Bench press", _chest, [_triceps]);
        StarterExerciseAlsoWorks kept = exercise.AlsoWorks[0];

        exercise.Update("Dips", _triceps, [_chest, _shoulders]);

        exercise.Name.ShouldBe("Dips");
        exercise.GroupId.ShouldBe(_triceps);
        exercise.AlsoWorks.Select(alsoWorks => alsoWorks.GroupId).ShouldBe([_chest, _shoulders], ignoreOrder: true);
        exercise.AlsoWorks.ShouldNotContain(kept);
    }

    [Fact]
    public void ARenamedGroupIsTrimmed()
    {
        StarterGroup group = StarterGroup.Create("Chest", 0);

        group.Rename(" Upper chest ");

        group.Name.ShouldBe("Upper chest");
        group.NormalizedName.ShouldBe("upper chest");
        group.Order.ShouldBe(0);
    }
}
