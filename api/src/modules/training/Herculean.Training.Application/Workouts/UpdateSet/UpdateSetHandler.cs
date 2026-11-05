using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.UpdateSet;

internal sealed class UpdateSetHandler(
    IValidator<UpdateSetRequest> validator,
    IWorkoutRepository workoutRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<List<SetResponse>>> HandleAsync(Guid id, Guid workoutExerciseId, Guid setId, UpdateSetRequest request, CancellationToken cancellationToken)
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

        Result<WorkoutExercise> exercise = workout.UpdateSet(WorkoutExerciseId.From(workoutExerciseId), SetId.From(setId), request.WeightKg, request.Reps, request.Checked);
        if (!exercise.IsSuccess)
        {
            return exercise.Error;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return exercise.Value.Sets.Select(SetResponse.From).ToList();
    }
}
