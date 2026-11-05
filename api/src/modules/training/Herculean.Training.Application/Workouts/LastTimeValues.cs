using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts;

internal static class LastTimeValues
{
    /// <summary>Each exercise's sets last time, as the values new sets start from.</summary>
    public static Dictionary<ExerciseId, List<SetValues>> ToSetValues(this Dictionary<ExerciseId, LastTimeResponse> lastTime) =>
        lastTime.ToDictionary(pair => pair.Key, pair => pair.Value.Sets.Select(set => new SetValues(set.WeightKg, set.Reps)).ToList());
}
