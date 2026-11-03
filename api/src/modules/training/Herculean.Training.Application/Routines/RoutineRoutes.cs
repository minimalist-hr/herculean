namespace Herculean.Training.Application.Routines;

internal static class RoutineRoutes
{
    public const string Tag = "Routines";

    public const string Routines = "/api/v1/routines";

    public const string Routine = $"{Routines}/{{id:guid}}";

    public const string RestoreRoutine = $"{Routine}/restore";
}
