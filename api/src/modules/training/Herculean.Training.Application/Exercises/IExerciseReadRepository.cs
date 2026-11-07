using Herculean.Training.Application.Exercises.GetExercise;
using Herculean.Training.Application.Exercises.ListExerciseSessions;
using Herculean.Training.Application.Exercises.ListExercises;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Application.Exercises;

internal interface IExerciseReadRepository
{
    /// <summary>The current user's exercises, by group order, then name.</summary>
    /// <param name="search">Part of the name, in any case. Null finds every name.</param>
    /// <param name="groupId">The group they belong to. Null finds every group.</param>
    /// <param name="cancellationToken">Stops the read.</param>
    Task<List<ExerciseListItemResponse>> ListAsync(string? search, GroupId? groupId, CancellationToken cancellationToken);

    /// <summary>One of the current user's exercises, or null if there is none.</summary>
    /// <param name="id">The exercise's ID.</param>
    /// <param name="cancellationToken">Stops the read.</param>
    Task<ExerciseDetailsResponse?> GetAsync(ExerciseId id, CancellationToken cancellationToken);

    /// <summary>Whether the current user has this exercise.</summary>
    /// <param name="id">The exercise's ID.</param>
    /// <param name="cancellationToken">Stops the read.</param>
    Task<bool> ExistsAsync(ExerciseId id, CancellationToken cancellationToken);

    /// <summary>The completed workouts with checked sets of the exercise, newest first, each with those sets in order.</summary>
    /// <param name="id">The exercise's ID.</param>
    /// <param name="before">Only workouts before this date. Null starts from the newest.</param>
    /// <param name="take">How many to read.</param>
    /// <param name="cancellationToken">Stops the read.</param>
    Task<List<ExerciseSessionResponse>> ListSessionsAsync(ExerciseId id, DateOnly? before, int take, CancellationToken cancellationToken);

    /// <summary>The number of sessions in each month between two dates, newest first. Months without any are left out.</summary>
    /// <param name="id">The exercise's ID.</param>
    /// <param name="from">The first date counted.</param>
    /// <param name="to">The last date counted.</param>
    /// <param name="cancellationToken">Stops the read.</param>
    Task<List<SessionMonthResponse>> ListSessionMonthsAsync(ExerciseId id, DateOnly from, DateOnly to, CancellationToken cancellationToken);
}
