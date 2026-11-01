using Herculean.SharedKernel.Results;
using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Application.Exercises.GetExercise;

internal sealed class GetExerciseHandler(IExerciseReadRepository exerciseReadRepository)
{
    public async Task<Result<ExerciseDetailsResponse>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        ExerciseDetailsResponse? exercise = await exerciseReadRepository.GetAsync(ExerciseId.From(id), cancellationToken);

        return exercise is null ? ExerciseErrors.NotFound : exercise;
    }
}
