namespace Herculean.Training.Application.Groups;

internal static class GroupRoutes
{
    public const string Tag = "Groups";

    public const string Groups = "/api/v1/groups";

    public const string Group = $"{Groups}/{{id:guid}}";

    public const string RestoreGroup = $"{Group}/restore";

    public const string GroupOrder = "/api/v1/group-order";
}
