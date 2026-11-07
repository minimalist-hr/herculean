using System.ComponentModel;

using Microsoft.AspNetCore.Mvc;

namespace Herculean.Training.Application.Exercises.GetExerciseProgress;

internal sealed record GetExerciseProgressRequest(
    [property: FromRoute(Name = "id"), Description("The exercise's ID.")] Guid Id,
    [property: FromQuery(Name = "range"), Description("How far back to read, up to today: 3m, 6m, 1y or all. Leave it out for 3m.")] string Range = "3m");
