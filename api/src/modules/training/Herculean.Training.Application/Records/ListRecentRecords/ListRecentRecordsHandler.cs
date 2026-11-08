using Herculean.Training.Application.Auth;

namespace Herculean.Training.Application.Records.ListRecentRecords;

internal sealed class ListRecentRecordsHandler(IRecordReadRepository recordReadRepository, UserClock userClock)
{
    private const int RecentDays = 30;
    private const int MaxRecords = 3;

    /// <summary>The newest record of each exercise from the last 30 days, newest first, at most three.</summary>
    public async Task<List<RecentRecordResponse>> HandleAsync(CancellationToken cancellationToken)
    {
        DateOnly since = (await userClock.GetTodayAsync(cancellationToken)).AddDays(-RecentDays);
        List<HeaviestSession> sessions = await recordReadRepository.ListHeaviestSessionsAsync(cancellationToken);

        return
        [
            .. sessions
                .GroupBy(session => session.ExerciseId)
                .Select(exercise => LatestRecord(exercise, since))
                .OfType<HeaviestSession>()
                .OrderByDescending(record => record.Date)
                .Take(MaxRecords)
                .Select(record => new RecentRecordResponse(record.ExerciseId.Value, record.ExerciseName, record.WeightKg, record.Reps, record.Date)),
        ];
    }

    /// <summary>The first time an exercise is done sets its best without being a record. A bodyweight set has no weight to beat.</summary>
    private static HeaviestSession? LatestRecord(IEnumerable<HeaviestSession> sessions, DateOnly since)
    {
        HeaviestSession? record = null;
        decimal? best = null;

        foreach (HeaviestSession session in sessions.OrderBy(session => session.Date))
        {
            if (session.WeightKg > best && session.Date >= since)
            {
                record = session;
            }

            best = best is null ? session.WeightKg : Math.Max(best.Value, session.WeightKg);
        }

        return record;
    }
}
