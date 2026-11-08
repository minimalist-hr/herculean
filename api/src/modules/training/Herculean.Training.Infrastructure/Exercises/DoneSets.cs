using Herculean.Training.Application.Exercises;
using Herculean.Training.Application.Exercises.ListExercises;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Workouts;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Exercises;

/// <summary>The checked sets in completed workouts, which are all that counts towards an exercise's progress.</summary>
internal static class DoneSets
{
    // Init properties, not a constructor, so EF can translate grouping by them.
    internal sealed record DoneSet
    {
        public required ExerciseId ExerciseId { get; init; }

        public required WorkoutId WorkoutId { get; init; }

        public required DateOnly Date { get; init; }

        public required decimal WeightKg { get; init; }

        public required int Reps { get; init; }
    }

    internal static IQueryable<DoneSet> Of(TrainingDbContext dbContext, IReadOnlyCollection<ExerciseId> exerciseIds) =>
        dbContext.Set<WorkoutExercise>()
            .AsNoTracking()
            .Where(exercise => exerciseIds.Contains(exercise.ExerciseId))
            .Join(
                dbContext.Workouts.Where(workout => workout.Status == WorkoutStatus.Completed),
                exercise => exercise.WorkoutId,
                workout => workout.Id,
                (exercise, workout) => new { exercise, workout.Date })
            .SelectMany(
                done => done.exercise.Sets.Where(set => set.Checked),
                (done, set) => new DoneSet
                {
                    ExerciseId = done.exercise.ExerciseId,
                    WorkoutId = done.exercise.WorkoutId,
                    Date = done.Date,
                    WeightKg = set.WeightKg,
                    Reps = set.Reps,
                });

    /// <summary>Each exercise's heaviest set, then the most reps at that weight, on the first date it was done. Exercises not done yet are left out.</summary>
    internal static Task<Dictionary<ExerciseId, BestSetResponse>> ListBestAsync(
        TrainingDbContext dbContext,
        IReadOnlyCollection<ExerciseId> exerciseIds,
        CancellationToken cancellationToken) =>
        Of(dbContext, exerciseIds)
            .GroupBy(set => set.ExerciseId)
            .Select(sets => sets.OrderByDescending(set => set.WeightKg).ThenByDescending(set => set.Reps).ThenBy(set => set.Date).First())
            .ToDictionaryAsync(set => set.ExerciseId, set => new BestSetResponse(set.WeightKg, set.Reps, set.Date), cancellationToken);

    /// <summary>The date of each completed workout with a checked set of the exercise.</summary>
    internal static Task<List<DateOnly>> ListWorkoutDatesAsync(TrainingDbContext dbContext, ExerciseId exerciseId, CancellationToken cancellationToken) =>
        Of(dbContext, [exerciseId])
            .GroupBy(set => set.WorkoutId)
            .Select(sets => sets.Min(set => set.Date))
            .ToListAsync(cancellationToken);

    /// <summary>The heaviest set of each session of the exercise, then the most reps at that weight, from a date on.</summary>
    internal static Task<List<DoneSet>> ListHeaviestPerSessionAsync(
        TrainingDbContext dbContext,
        ExerciseId exerciseId,
        DateOnly? from,
        CancellationToken cancellationToken) =>
        Of(dbContext, [exerciseId])
            .Where(set => from == null || set.Date >= from)
            .GroupBy(set => set.WorkoutId)
            .Select(sets => sets.OrderByDescending(set => set.WeightKg).ThenByDescending(set => set.Reps).First())
            .ToListAsync(cancellationToken);

    /// <summary>The heaviest set of every session of these exercises, then the most reps at that weight.</summary>
    internal static Task<List<DoneSet>> ListHeaviestPerSessionAsync(
        TrainingDbContext dbContext,
        IReadOnlyCollection<ExerciseId> exerciseIds,
        CancellationToken cancellationToken) =>
        Of(dbContext, exerciseIds)
            .GroupBy(set => new { set.ExerciseId, set.WorkoutId })
            .Select(sets => sets.OrderByDescending(set => set.WeightKg).ThenByDescending(set => set.Reps).First())
            .ToListAsync(cancellationToken);

    internal sealed record SessionMonth(int Year, int Month, int Sessions);

    /// <summary>The number of sessions of the exercise in each month between two dates. A day has at most one workout, so each date is one session.</summary>
    internal static Task<List<SessionMonth>> ListMonthsAsync(
        TrainingDbContext dbContext,
        ExerciseId exerciseId,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken) =>
        Of(dbContext, [exerciseId])
            .Where(set => set.Date >= from && set.Date <= to)
            .Select(set => set.Date)
            .Distinct()
            .GroupBy(date => new { date.Year, date.Month })
            .Select(dates => new SessionMonth(dates.Key.Year, dates.Key.Month, dates.Count()))
            .ToListAsync(cancellationToken);

    /// <summary>The exercises with their best sets filled in.</summary>
    internal static async Task<List<ExerciseListItemResponse>> WithBestSetsAsync(
        TrainingDbContext dbContext,
        List<ExerciseListItemResponse> exercises,
        CancellationToken cancellationToken)
    {
        Dictionary<ExerciseId, BestSetResponse> best = await ListBestAsync(
            dbContext,
            [.. exercises.Select(exercise => ExerciseId.From(exercise.Id))],
            cancellationToken);

        return [.. exercises.Select(exercise => exercise with { BestSet = best.GetValueOrDefault(ExerciseId.From(exercise.Id)) })];
    }
}
