namespace Herculean.Training.Application.Exercises;

internal static class ExerciseRoutes
{
    public const string Tag = "Exercises";

    public const string Exercises = "/api/v1/exercises";

    public const string Exercise = $"{Exercises}/{{id:guid}}";
}
