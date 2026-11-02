using Herculean.SharedKernel.Results;

namespace Herculean.Training.Domain.Routines;

internal static class RoutineErrors
{
    public static readonly Error NameTaken = Error.Conflict("routine.name_taken", "You already have a routine with this name.");

    public static readonly Error LimitReached = Error.Conflict("routine.limit_reached", $"You've reached the limit of {Routine.MaxPerUser} routines.");
}
