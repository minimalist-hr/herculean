using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.AddSet;

internal sealed class AddSetHandler(
    IValidator<AddSetRequest> validator,
    IWorkoutRepository workoutRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<SetResponse>> HandleAsync(Guid id, Guid workoutExerciseId, AddSetRequest request, CancellationToken cancellationToken)
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

        WorkoutExerciseId exerciseId = WorkoutExerciseId.From(workoutExerciseId);
        Result<Set> set = request.Removed is RemovedSet removed
            ? workout.RestoreSet(exerciseId, removed.Order, new SetValues(removed.WeightKg, removed.Reps, removed.PartialsDone), removed.Checked)
            : workout.AddSet(exerciseId);
        if (!set.IsSuccess)
        {
            return set.Error;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return SetResponse.From(set.Value);
    }
}
