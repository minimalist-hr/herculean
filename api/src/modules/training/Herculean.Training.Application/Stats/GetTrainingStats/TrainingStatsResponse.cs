using System.ComponentModel;

namespace Herculean.Training.Application.Stats.GetTrainingStats;

[Description("How much people train. Weeks are the last 7 days and the 7 before them.")]
internal sealed record TrainingStatsResponse(
    [property: Description("Users who finished a workout in the last 7 days.")] int ActiveThisWeek,
    [property: Description("Workouts finished in the last 7 days.")] int WorkoutsThisWeek,
    [property: Description("Workouts finished in the 7 days before.")] int WorkoutsLastWeek,
    [property: Description("Active users each week for the last 4 weeks, oldest first, the last 7 days last.")] List<int> ActivePerWeek,
    [property: Description("Workouts finished each week for the last 4 weeks, oldest first, the last 7 days last.")] List<int> WorkoutsPerWeek);
