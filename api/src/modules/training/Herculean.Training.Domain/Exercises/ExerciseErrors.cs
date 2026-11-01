using Herculean.SharedKernel.Results;

namespace Herculean.Training.Domain.Exercises;

internal static class ExerciseErrors
{
    public static readonly Error NotFound = Error.NotFound("exercise.not_found", "The exercise does not exist.");

    public static readonly Error NameTaken = Error.Conflict("exercise.name_taken", "You already have an exercise with this name.");

    public static readonly Error LimitReached = Error.Conflict("exercise.limit_reached", $"You've reached the limit of {Exercise.MaxPerUser} exercises.");
}
