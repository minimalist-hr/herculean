namespace Herculean.Training.Domain.Workouts;

/// <summary>The weight and reps of a set, and whether lengthened partials were done after it.</summary>
internal sealed record SetValues(decimal WeightKg, int Reps, bool PartialsDone = false);
