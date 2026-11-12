namespace Herculean.Training.Domain.Starter;

internal interface IStarterExerciseRepository
{
    /// <summary>Every starter exercise with its also works groups.</summary>
    Task<List<StarterExercise>> ListAsync(CancellationToken cancellationToken);

    /// <summary>A starter exercise with its also works groups, or null if there is none.</summary>
    Task<StarterExercise?> GetAsync(StarterExerciseId id, CancellationToken cancellationToken);

    Task<int> CountAsync(CancellationToken cancellationToken);

    /// <summary>Checks the starter exercises for the name, regardless of case.</summary>
    /// <param name="name">The name to look for.</param>
    /// <param name="exceptId">An exercise to leave out, so one can keep its own name. Null checks them all.</param>
    /// <param name="cancellationToken">Stops the check.</param>
    Task<bool> NameExistsAsync(string name, StarterExerciseId? exceptId, CancellationToken cancellationToken);

    void Add(StarterExercise exercise);

    void Remove(StarterExercise exercise);
}
