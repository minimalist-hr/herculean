using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.EditWorkout;

internal sealed class EditWorkoutHandler(
    IValidator<EditWorkoutRequest> validator,
    IWorkoutRepository workoutRepository,
    IExerciseRepository exerciseRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<WorkoutResponse>> HandleAsync(Guid id, EditWorkoutRequest request, CancellationToken cancellationToken)
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

        // Only exercises added while editing must still exist. Kept ones stay, even if their exercise was deleted since.
        List<ExerciseId> added = [.. request.Exercises.Where(exercise => exercise.Id is null).Select(exercise => ExerciseId.From(exercise.ExerciseId))];
        if (added.Count > 0 && !await exerciseRepository.AllExistAsync(added, cancellationToken))
        {
            return ExerciseErrors.NotFound;
        }

        Result edited = workout.Edit([
            .. request.Exercises.Select(exercise => new EditedExercise(
                exercise.Id is Guid kept ? WorkoutExerciseId.From(kept) : null,
                ExerciseId.From(exercise.ExerciseId),
                [.. exercise.Sets.Select(set => new SetValues(set.WeightKg, set.Reps))],
                exercise.SupersetWithNext)),
        ], request.DurationMinutes);
        if (!edited.IsSuccess)
        {
            return edited.Error;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new WorkoutResponse(workout.Id.Value, workout.Date, workout.Status, workout.Name);
    }
}
