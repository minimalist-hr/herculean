namespace Herculean.Training.Application.Workouts;

internal static class WorkoutRoutes
{
    public const string Tag = "Workouts";

    public const string Workouts = "/api/v1/workouts";

    public const string Workout = $"{Workouts}/{{id:guid}}";

    public const string Sets = $"{Workout}/exercises/{{workoutExerciseId:guid}}/sets";

    public const string Set = $"{Sets}/{{setId:guid}}";
}
