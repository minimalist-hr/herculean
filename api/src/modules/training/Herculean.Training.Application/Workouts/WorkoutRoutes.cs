namespace Herculean.Training.Application.Workouts;

internal static class WorkoutRoutes
{
    public const string Tag = "Workouts";

    public const string Workouts = "/api/v1/workouts";

    public const string Workout = $"{Workouts}/{{id:guid}}";

    public const string RestoreWorkout = $"{Workout}/restore";

    public const string Summary = $"{Workout}/summary";

    public const string Exercises = $"{Workout}/exercises";

    public const string Exercise = $"{Exercises}/{{workoutExerciseId:guid}}";

    public const string ExerciseOrder = $"{Workout}/exercise-order";

    public const string Sets = $"{Exercise}/sets";

    public const string Set = $"{Sets}/{{setId:guid}}";
}
