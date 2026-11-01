using System.ComponentModel;

using Microsoft.AspNetCore.Mvc;

namespace Herculean.Training.Application.Exercises.ListExercises;

internal sealed record ListExercisesRequest(
    [property: FromQuery(Name = "search"), Description("Part of the exercise's name, in any case.")] string? Search,
    [property: FromQuery(Name = "groupId"), Description("Only exercises in this group.")] Guid? GroupId);
