using Herculean.SharedKernel.Results;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Domain.Starter;

internal static class StarterErrors
{
    public static readonly Error GroupNotFound = Error.NotFound("starter_group.not_found", "The starter group does not exist.");

    public static readonly Error GroupNameTaken = Error.Conflict("starter_group.name_taken", "You already have a starter group with this name.");

    public static readonly Error GroupLimitReached = Error.Conflict("starter_group.limit_reached", $"There can be at most {Group.MaxPerUser} starter groups.");

    public static readonly Error GroupInUse = Error.Conflict("starter_group.in_use", "Move its exercises to another group first.");

    public static readonly Error ExerciseNotFound = Error.NotFound("starter_exercise.not_found", "The starter exercise does not exist.");

    public static readonly Error ExerciseNameTaken = Error.Conflict("starter_exercise.name_taken", "You already have a starter exercise with this name.");

    public static readonly Error ExerciseLimitReached = Error.Conflict("starter_exercise.limit_reached", $"There can be at most {Exercise.MaxPerUser} starter exercises.");
}
