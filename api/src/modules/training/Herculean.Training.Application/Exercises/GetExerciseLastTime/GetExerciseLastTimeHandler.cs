using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Application.Workouts;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Application.Exercises.GetExerciseLastTime;

internal sealed class GetExerciseLastTimeHandler(
    IValidator<GetExerciseLastTimeRequest> validator,
    IExerciseReadRepository exerciseReadRepository,
    IWorkoutReadRepository workoutReadRepository)
{
    public async Task<Result<ExerciseLastTimeResponse>> HandleAsync(GetExerciseLastTimeRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        ExerciseId id = ExerciseId.From(request.Id);
        if (!await exerciseReadRepository.ExistsAsync(id, cancellationToken))
        {
            return ExerciseErrors.NotFound;
        }

        Dictionary<ExerciseId, LastTimeResponse> lastTime = await workoutReadRepository.ListLastTimeAsync([id], request.Before, cancellationToken);

        return new ExerciseLastTimeResponse(lastTime.GetValueOrDefault(id));
    }
}
