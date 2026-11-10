using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.UpdateWorkoutExerciseSuperset;

internal sealed class UpdateWorkoutExerciseSupersetHandler(
    IValidator<UpdateWorkoutExerciseSupersetRequest> validator,
    IWorkoutRepository workoutRepository,
    IWorkoutReadRepository workoutReadRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<WorkoutDetailsResponse>> HandleAsync(Guid id, Guid workoutExerciseId, UpdateWorkoutExerciseSupersetRequest request, CancellationToken cancellationToken)
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

        Result changed = workout.ChangeSuperset(WorkoutExerciseId.From(workoutExerciseId), request.SupersetWithNext);
        if (!changed.IsSuccess)
        {
            return changed.Error;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return (await workoutReadRepository.GetAsync(workout.Id, cancellationToken))!;
    }
}
