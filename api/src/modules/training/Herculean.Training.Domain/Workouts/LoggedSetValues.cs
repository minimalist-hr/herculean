namespace Herculean.Training.Domain.Workouts;

/// <summary>A set as it was logged, to put back when a removal is undone.</summary>
internal sealed record LoggedSetValues(decimal WeightKg, int Reps, bool Checked);
