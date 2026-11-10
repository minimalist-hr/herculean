using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.AddWorkoutExercises;

internal sealed class AddWorkoutExercisesHandler(
    IValidator<AddWorkoutExercisesRequest> validator,
    IWorkoutRepository workoutRepository,
    IWorkoutReadRepository workoutReadRepository,
    IExerciseRepository exerciseRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<WorkoutDetailsResponse>> HandleAsync(Guid id, AddWorkoutExercisesRequest request, CancellationToken cancellationToken)
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

        List<ExerciseId> exerciseIds = request.Removed is RemovedExercise one
            ? [ExerciseId.From(one.ExerciseId)]
            : [.. request.ExerciseIds!.Select(ExerciseId.From)];
        if (!await exerciseRepository.AllExistAsync(exerciseIds, cancellationToken))
        {
            return ExerciseErrors.NotFound;
        }

        Result added = request.Removed is RemovedExercise removed
            ? workout.RestoreExercise(
                removed.Order,
                new RoutineExerciseValues(ExerciseId.From(removed.ExerciseId), removed.TargetSets, removed.TargetRepsFrom, removed.TargetRepsTo, removed.SupersetWithNext),
                [.. removed.Sets.Select(set => new LoggedSetValues(set.WeightKg, set.Reps, set.Checked))],
                removed.SupersetWithPrevious)
            : workout.AddExercises(exerciseIds, (await workoutReadRepository.ListLastTimeAsync(exerciseIds, workout.Date, cancellationToken)).ToSetValues(), request.AsSuperset);
        if (!added.IsSuccess)
        {
            return added.Error;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return (await workoutReadRepository.GetAsync(workout.Id, cancellationToken))!;
    }
}
