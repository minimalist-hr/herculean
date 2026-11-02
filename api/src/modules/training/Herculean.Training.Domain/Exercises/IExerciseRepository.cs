namespace Herculean.Training.Domain.Exercises;

internal interface IExerciseRepository
{
    /// <summary>Counts the current user's exercises.</summary>
    Task<int> CountAsync(CancellationToken cancellationToken);

    /// <summary>One of the current user's exercises with its also works groups, or null if there is none.</summary>
    Task<Exercise?> GetAsync(ExerciseId id, CancellationToken cancellationToken);

    /// <summary>Checks the current user's exercises for the name, regardless of case.</summary>
    /// <param name="name">The name to look for.</param>
    /// <param name="exceptId">An exercise to leave out, so one can keep its own name. Null checks them all.</param>
    /// <param name="cancellationToken">Stops the check.</param>
    Task<bool> NameExistsAsync(string name, ExerciseId? exceptId, CancellationToken cancellationToken);

    /// <summary>Checks that all of these are the current user's exercises.</summary>
    Task<bool> AllExistAsync(IReadOnlyCollection<ExerciseId> ids, CancellationToken cancellationToken);

    void Add(Exercise exercise);
}
