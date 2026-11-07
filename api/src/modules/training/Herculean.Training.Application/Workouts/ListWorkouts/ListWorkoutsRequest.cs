using System.ComponentModel;

using Microsoft.AspNetCore.Mvc;

namespace Herculean.Training.Application.Workouts.ListWorkouts;

internal sealed record ListWorkoutsRequest(
    [property: FromQuery(Name = "status"), Description("Only workouts that stand here. Only inProgress for now.")] string? Status);
