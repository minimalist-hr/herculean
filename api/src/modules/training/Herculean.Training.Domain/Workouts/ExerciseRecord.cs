namespace Herculean.Training.Domain.Workouts;

/// <summary>The set that beat what an exercise had done before.</summary>
internal sealed record ExerciseRecord(RecordKind Kind, decimal WeightKg, int Reps)
{
    /// <summary>An exercise's one record in a workout, or null. A first session has nothing to beat. A heavier weight comes first, then the most reps at a weight done before.</summary>
    /// <param name="sets">The checked sets in this workout.</param>
    /// <param name="earlierMostReps">The most reps at each weight on earlier dates.</param>
    public static ExerciseRecord? Find(IReadOnlyCollection<SetValues> sets, IReadOnlyDictionary<decimal, int> earlierMostReps)
    {
        if (sets.Count == 0 || earlierMostReps.Count == 0)
        {
            return null;
        }

        List<SetValues> strongestFirst = [.. sets.OrderByDescending(set => set.WeightKg).ThenByDescending(set => set.Reps)];
        decimal heaviestBefore = earlierMostReps.Keys.Max();
        if (strongestFirst[0].WeightKg > heaviestBefore)
        {
            return new ExerciseRecord(RecordKind.HeaviestWeight, strongestFirst[0].WeightKg, strongestFirst[0].Reps);
        }

        SetValues? moreReps = strongestFirst.Find(set => earlierMostReps.TryGetValue(set.WeightKg, out int reps) && set.Reps > reps);

        return moreReps is null ? null : new ExerciseRecord(RecordKind.MostReps, moreReps.WeightKg, moreReps.Reps);
    }
}
