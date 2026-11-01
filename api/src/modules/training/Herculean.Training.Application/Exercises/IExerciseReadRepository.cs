using Herculean.Training.Application.Exercises.GetExercise;
using Herculean.Training.Application.Exercises.ListExercises;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Application.Exercises;

internal interface IExerciseReadRepository
{
    /// <summary>The current user's exercises, by group order, then name.</summary>
    /// <param name="search">Part of the name, in any case. Null finds every name.</param>
    /// <param name="groupId">The group they belong to. Null finds every group.</param>
    /// <param name="cancellationToken">Stops the read.</param>
    Task<List<ExerciseListItemResponse>> ListAsync(string? search, GroupId? groupId, CancellationToken cancellationToken);

    /// <summary>One of the current user's exercises, or null if there is none.</summary>
    /// <param name="id">The exercise's ID.</param>
    /// <param name="cancellationToken">Stops the read.</param>
    Task<ExerciseDetailsResponse?> GetAsync(ExerciseId id, CancellationToken cancellationToken);
}
