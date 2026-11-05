using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Domain.Workouts;

public sealed class ExerciseRecordTests
{
    private static readonly Dictionary<decimal, int> Earlier = new() { [80m] = 10, [82.5m] = 6 };

    [Fact]
    public void AFirstSessionHasNoRecord()
    {
        ExerciseRecord.Find([new SetValues(100, 5)], new Dictionary<decimal, int>()).ShouldBeNull();
    }

    [Fact]
    public void NoCheckedSetsHaveNoRecord()
    {
        ExerciseRecord.Find([], Earlier).ShouldBeNull();
    }

    [Fact]
    public void AHeavierWeightIsARecordWithItsBestReps()
    {
        ExerciseRecord? record = ExerciseRecord.Find([new SetValues(85, 5), new SetValues(85, 8), new SetValues(80, 9)], Earlier);

        record.ShouldBe(new ExerciseRecord(RecordKind.HeaviestWeight, 85, 8));
    }

    [Fact]
    public void MoreRepsAtAWeightDoneBeforeIsARecord()
    {
        ExerciseRecord? record = ExerciseRecord.Find([new SetValues(80, 11)], Earlier);

        record.ShouldBe(new ExerciseRecord(RecordKind.MostReps, 80, 11));
    }

    [Fact]
    public void AHeavierWeightComesBeforeMoreReps()
    {
        ExerciseRecord? record = ExerciseRecord.Find([new SetValues(80, 12), new SetValues(90, 3)], Earlier);

        record!.Kind.ShouldBe(RecordKind.HeaviestWeight);
    }

    [Fact]
    public void OfSeveralMoreRepsTheHeaviestWeightCounts()
    {
        ExerciseRecord? record = ExerciseRecord.Find([new SetValues(80, 12), new SetValues(82.5m, 7)], Earlier);

        record.ShouldBe(new ExerciseRecord(RecordKind.MostReps, 82.5m, 7));
    }

    [Fact]
    public void EqualRepsAreNotARecord()
    {
        ExerciseRecord.Find([new SetValues(80, 10)], Earlier).ShouldBeNull();
    }

    [Fact]
    public void ALighterWeightNeverDoneBeforeIsNotARecord()
    {
        ExerciseRecord.Find([new SetValues(60, 20)], Earlier).ShouldBeNull();
    }
}
