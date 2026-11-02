using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Domain.Routines;

internal interface IRoutineRepository
{
    /// <summary>Counts the current user's routines.</summary>
    Task<int> CountAsync(CancellationToken cancellationToken);

    /// <summary>Checks the current user's routines for the name, regardless of case.</summary>
    Task<bool> NameExistsAsync(string name, CancellationToken cancellationToken);

    /// <summary>Takes an exercise out of the current user's routines, on the next save.</summary>
    Task RemoveExerciseAsync(ExerciseId exerciseId, CancellationToken cancellationToken);

    void Add(Routine routine);
}
