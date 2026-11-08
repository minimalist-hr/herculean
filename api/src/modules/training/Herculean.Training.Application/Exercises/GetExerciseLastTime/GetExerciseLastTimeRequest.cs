using System.ComponentModel;

using Microsoft.AspNetCore.Mvc;

namespace Herculean.Training.Application.Exercises.GetExerciseLastTime;

internal sealed record GetExerciseLastTimeRequest(
    [property: FromRoute(Name = "id"), Description("The exercise's ID.")] Guid Id,
    [property: FromQuery(Name = "before"), Description("Only workouts before this date count, such as the date of the workout it's added to.")] DateOnly Before);
