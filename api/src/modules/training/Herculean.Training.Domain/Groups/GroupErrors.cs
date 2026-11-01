using Herculean.SharedKernel.Results;

namespace Herculean.Training.Domain.Groups;

internal static class GroupErrors
{
    public static readonly Error NotFound = Error.NotFound("group.not_found", "The group does not exist.");

    public static readonly Error NameTaken = Error.Conflict("group.name_taken", "You already have a group with this name.");

    public static readonly Error LimitReached = Error.Conflict("group.limit_reached", $"You've reached the limit of {Group.MaxPerUser} groups.");

    public static readonly Error InUse = Error.Conflict("group.in_use", "Move or delete this group's exercises first.");

    public static readonly Error OrderOutOfDate = Error.Conflict("group.order_out_of_date", "Your groups have changed. Try again.");
}
