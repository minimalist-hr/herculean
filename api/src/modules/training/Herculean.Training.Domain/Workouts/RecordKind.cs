using System.ComponentModel;

namespace Herculean.Training.Domain.Workouts;

/// <summary>What a record beat.</summary>
[Description("What a record beat: the heaviest weight, or the most reps at a weight.")]
internal enum RecordKind
{
    HeaviestWeight,
    MostReps,
}
