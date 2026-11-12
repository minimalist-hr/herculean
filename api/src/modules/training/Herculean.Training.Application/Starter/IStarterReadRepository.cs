using Herculean.Training.Application.Starter.ListStarterExercises;
using Herculean.Training.Application.Starter.ListStarterGroups;

namespace Herculean.Training.Application.Starter;

internal interface IStarterReadRepository
{
    /// <summary>Every starter group in order, with how many starter exercises belong to it.</summary>
    Task<List<StarterGroupResponse>> ListGroupsAsync(CancellationToken cancellationToken);

    /// <summary>Every starter exercise, in the order they were made.</summary>
    Task<List<StarterExerciseResponse>> ListExercisesAsync(CancellationToken cancellationToken);
}
