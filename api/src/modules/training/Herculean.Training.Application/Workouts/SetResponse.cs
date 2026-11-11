using System.ComponentModel;

using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts;

[Description("A set in a workout.")]
internal sealed record SetResponse(
    [property: Description("The set's ID.")] Guid Id,
    [property: Description("Its place in the exercise, from 0.")] int Order,
    [property: Description("The weight in kg. 0 means bodyweight.")] decimal WeightKg,
    [property: Description("The reps.")] int Reps,
    [property: Description("Whether it is marked done.")] bool Checked,
    [property: Description("Whether lengthened partials were done after it.")] bool PartialsDone = false)
{
    internal static SetResponse From(Set set) => new(set.Id.Value, set.Order, set.WeightKg, set.Reps, set.Checked, set.PartialsDone);
}
