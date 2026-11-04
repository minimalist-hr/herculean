using Herculean.SharedKernel.Results;

namespace Herculean.Training.Domain.Workouts;

internal static class WorkoutErrors
{
    public static readonly Error NotFound = Error.NotFound("workout.not_found", "The workout does not exist.");

    public static readonly Error DateTaken = Error.Conflict("workout.date_taken", "This day already has a workout.");

    public static readonly Error DateInTheFuture = Error.Conflict("workout.date_in_the_future", "A day that hasn't come yet can't be skipped.");

    public static readonly Error NothingPlanned = Error.Conflict("workout.nothing_planned", "This day has no routine to skip.");
}
