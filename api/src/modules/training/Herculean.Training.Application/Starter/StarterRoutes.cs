namespace Herculean.Training.Application.Starter;

internal static class StarterRoutes
{
    public const string Tag = "Starter content";

    public const string Groups = "/api/v1/admin/starter-groups";

    public const string Group = $"{Groups}/{{id:guid}}";

    public const string Exercises = "/api/v1/admin/starter-exercises";

    public const string Exercise = $"{Exercises}/{{id:guid}}";
}
