using Herculean.SharedKernel.Results;

namespace Herculean.Training.Application.Starter.ListStarterExercises;

internal sealed class ListStarterExercisesHandler(IStarterReadRepository starterReadRepository)
{
    public async Task<Result<List<StarterExerciseResponse>>> HandleAsync(CancellationToken cancellationToken) =>
        await starterReadRepository.ListExercisesAsync(cancellationToken);
}
