using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.GetWorkoutSummary;

internal sealed class GetWorkoutSummaryHandler(
    IWorkoutReadRepository workoutReadRepository,
    TimeProvider timeProvider)
{
    public async Task<Result<WorkoutSummaryResponse>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        WorkoutDetailsResponse? workout = await workoutReadRepository.GetAsync(WorkoutId.From(id), cancellationToken);
        if (workout is null)
        {
            return WorkoutErrors.NotFound;
        }

        List<SetResponse> sets = [.. workout.Exercises.SelectMany(exercise => exercise.Sets)];
        List<SetResponse> checkedSets = [.. sets.Where(set => set.Checked)];

        return new WorkoutSummaryResponse(
            workout.Name,
            workout.Date,
            DurationSeconds(workout),
            checkedSets.Count,
            sets.Count,
            checkedSets.Sum(set => set.WeightKg * set.Reps),
            [
                .. workout.Exercises
                    .Where(exercise => exercise.Sets.Exists(set => !set.Checked))
                    .Select(exercise => new UncheckedExerciseResponse(exercise.Name, exercise.Sets.Count(set => !set.Checked), exercise.Sets.Count)),
            ],
            await RecordsAsync(workout, cancellationToken));
    }

    private int? DurationSeconds(WorkoutDetailsResponse workout) =>
        workout.Status != WorkoutStatus.InProgress
            ? workout.DurationSeconds
            : (int?)(timeProvider.GetUtcNow() - workout.StartedAtUtc)?.TotalSeconds;

    private async Task<List<WorkoutRecordResponse>> RecordsAsync(WorkoutDetailsResponse workout, CancellationToken cancellationToken)
    {
        List<ExerciseId> exerciseIds = [.. workout.Exercises.Select(exercise => ExerciseId.From(exercise.ExerciseId))];
        List<EarlierMostReps> earlier = await workoutReadRepository.ListEarlierMostRepsAsync(exerciseIds, workout.Date, cancellationToken);

        List<WorkoutRecordResponse> records = [];
        foreach (WorkoutExerciseResponse exercise in workout.Exercises)
        {
            ExerciseRecord? record = ExerciseRecord.Find(
                [.. exercise.Sets.Where(set => set.Checked).Select(set => new SetValues(set.WeightKg, set.Reps))],
                earlier.Where(best => best.ExerciseId.Value == exercise.ExerciseId).ToDictionary(best => best.WeightKg, best => best.Reps));
            if (record is not null)
            {
                records.Add(new WorkoutRecordResponse(exercise.Name, record.Kind, record.WeightKg, record.Reps));
            }
        }

        return records;
    }
}
