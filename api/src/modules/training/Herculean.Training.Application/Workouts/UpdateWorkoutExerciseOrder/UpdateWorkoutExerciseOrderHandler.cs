using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.UpdateWorkoutExerciseOrder;

internal sealed class UpdateWorkoutExerciseOrderHandler(
    IValidator<UpdateWorkoutExerciseOrderRequest> validator,
    IWorkoutRepository workoutRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, UpdateWorkoutExerciseOrderRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        Workout? workout = await workoutRepository.GetWithSetsAsync(WorkoutId.From(id), cancellationToken);
        if (workout is null)
        {
            return WorkoutErrors.NotFound;
        }

        Result result = workout.ReorderExercises([.. request.WorkoutExerciseIds.Select(WorkoutExerciseId.From)]);
        if (!result.IsSuccess)
        {
            return result;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
