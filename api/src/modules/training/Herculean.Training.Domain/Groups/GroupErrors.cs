using Herculean.SharedKernel.Results;

namespace Herculean.Training.Domain.Groups;

internal static class GroupErrors
{
    public static readonly Error NotFound = Error.NotFound("group.not_found", "The group does not exist.");
}
