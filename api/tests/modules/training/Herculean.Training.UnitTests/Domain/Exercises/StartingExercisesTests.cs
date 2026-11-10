using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.UnitTests.Domain.Exercises;

public sealed class StartingExercisesTests
{
    [Fact]
    public void EveryStarterIsInAStartingGroupAndAlsoWorksOthers()
    {
        Exercise.Starting.ShouldAllBe(exercise =>
            Group.StartingNames.Contains(exercise.Group)
            && exercise.AlsoWorks.All(name => Group.StartingNames.Contains(name) && name != exercise.Group));
    }

    [Fact]
    public void StarterNamesAreUniqueAndFitTheLimit()
    {
        Exercise.Starting.Select(exercise => Exercise.NormalizeName(exercise.Name)).ShouldBeUnique();
        Exercise.Starting.ShouldAllBe(exercise => exercise.Name.Length <= Exercise.NameMaxLength);
    }
}
