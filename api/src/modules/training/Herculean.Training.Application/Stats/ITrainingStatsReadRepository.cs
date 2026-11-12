namespace Herculean.Training.Application.Stats;

/// <summary>Every user's training, counted for admins. Only counts, never what anyone logged.</summary>
internal interface ITrainingStatsReadRepository
{
    /// <summary>Who finished a workout since <paramref name="since"/>, and when, one entry per workout.</summary>
    Task<List<FinishedWorkout>> ListFinishedSinceAsync(DateTimeOffset since, CancellationToken cancellationToken);

    /// <summary>How many workouts a user finished and how many routines they have, deleted ones left out.</summary>
    Task<UserTrainingCounts> CountForUserAsync(Guid userId, CancellationToken cancellationToken);
}

/// <summary>A finished workout: whose, and when it was finished.</summary>
internal sealed record FinishedWorkout(Guid UserId, DateTimeOffset FinishedAtUtc);

/// <summary>A user's training, counted.</summary>
internal sealed record UserTrainingCounts(int Workouts, int Routines);
