using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.ListWorkouts;

internal sealed class ListWorkoutsHandler(
    IValidator<ListWorkoutsRequest> validator,
    IWorkoutReadRepository workoutReadRepository)
{
    public async Task<Result<List<WorkoutResponse>>> HandleAsync(ListWorkoutsRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        return await workoutReadRepository.ListAsync(WorkoutStatus.InProgress, cancellationToken);
    }
}
