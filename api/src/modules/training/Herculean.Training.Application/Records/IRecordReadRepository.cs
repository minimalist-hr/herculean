using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Application.Records;

/// <summary>An exercise's heaviest set in one completed workout.</summary>
internal sealed record HeaviestSession(ExerciseId ExerciseId, string ExerciseName, DateOnly Date, decimal WeightKg, int Reps);

internal interface IRecordReadRepository
{
    /// <summary>Every session of the current user's exercises that aren't deleted, in no order.</summary>
    Task<List<HeaviestSession>> ListHeaviestSessionsAsync(CancellationToken cancellationToken);
}
