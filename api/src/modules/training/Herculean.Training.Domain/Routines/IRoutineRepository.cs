using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Domain.Routines;

internal interface IRoutineRepository
{
    /// <summary>Counts the current user's routines.</summary>
    Task<int> CountAsync(CancellationToken cancellationToken);

    /// <summary>One of the current user's routines with its exercises, or null if there is none.</summary>
    Task<Routine?> GetAsync(RoutineId id, CancellationToken cancellationToken);

    /// <summary>One of the current user's deleted routines with its exercises, or null if there is none.</summary>
    Task<Routine?> GetDeletedAsync(RoutineId id, CancellationToken cancellationToken);

    /// <summary>Checks the current user's routines for the name, regardless of case.</summary>
    /// <param name="name">The name to look for.</param>
    /// <param name="exceptId">A routine to leave out, so one can keep its own name. Null checks them all.</param>
    /// <param name="cancellationToken">Stops the check.</param>
    Task<bool> NameExistsAsync(string name, RoutineId? exceptId, CancellationToken cancellationToken);

    /// <summary>Checks whether any of the current user's routines has this exercise.</summary>
    Task<bool> UsesExerciseAsync(ExerciseId exerciseId, CancellationToken cancellationToken);

    void Add(Routine routine);
}
