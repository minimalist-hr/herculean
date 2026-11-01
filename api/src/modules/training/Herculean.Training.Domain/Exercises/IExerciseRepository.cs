namespace Herculean.Training.Domain.Exercises;

internal interface IExerciseRepository
{
    /// <summary>Counts the current user's exercises.</summary>
    Task<int> CountAsync(CancellationToken cancellationToken);

    /// <summary>Checks the current user's exercises for the name, regardless of case.</summary>
    Task<bool> NameExistsAsync(string name, CancellationToken cancellationToken);

    void Add(Exercise exercise);
}
