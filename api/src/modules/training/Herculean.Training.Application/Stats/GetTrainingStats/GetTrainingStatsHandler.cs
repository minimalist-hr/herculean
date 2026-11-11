using Herculean.SharedKernel.Time;

namespace Herculean.Training.Application.Stats.GetTrainingStats;

internal sealed class GetTrainingStatsHandler(ITrainingStatsReadRepository statsReadRepository, TimeProvider timeProvider)
{
    public async Task<TrainingStatsResponse> HandleAsync(CancellationToken cancellationToken)
    {
        DateTimeOffset now = timeProvider.GetUtcNow();
        List<FinishedWorkout> workouts = await statsReadRepository.ListFinishedSinceAsync(Weeks.StartOf(now, Weeks.TrendLength - 1), cancellationToken);

        List<int> workoutsPerWeek = Weeks.Count(workouts.Select(workout => workout.FinishedAtUtc), now);
        List<int> activePerWeek =
        [
            .. Enumerable.Range(0, Weeks.TrendLength).Select(week => workouts
                .Where(workout => Weeks.IndexOf(workout.FinishedAtUtc, now) == week)
                .Select(workout => workout.UserId)
                .Distinct()
                .Count()),
        ];

        return new TrainingStatsResponse(activePerWeek[^1], workoutsPerWeek[^1], workoutsPerWeek[^2], activePerWeek, workoutsPerWeek);
    }
}
