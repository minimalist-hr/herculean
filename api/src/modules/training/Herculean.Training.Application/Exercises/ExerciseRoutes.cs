namespace Herculean.Training.Application.Exercises;

internal static class ExerciseRoutes
{
    public const string Tag = "Exercises";

    public const string Exercises = "/api/v1/exercises";

    public const string Exercise = $"{Exercises}/{{id:guid}}";

    public const string RestoreExercise = $"{Exercise}/restore";

    public const string Sessions = $"{Exercise}/sessions";

    public const string Progress = $"{Exercise}/progress";

    public const string LastTime = $"{Exercise}/last-time";
}
