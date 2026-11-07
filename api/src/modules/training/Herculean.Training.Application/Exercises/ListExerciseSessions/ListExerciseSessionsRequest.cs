using System.ComponentModel;

using Microsoft.AspNetCore.Mvc;

namespace Herculean.Training.Application.Exercises.ListExerciseSessions;

internal sealed record ListExerciseSessionsRequest(
    [property: FromRoute(Name = "id"), Description("The exercise's ID.")] Guid Id,
    [property: FromQuery(Name = "cursor"), Description("The nextCursor of the page before. Leave it out for the newest sessions.")] string? Cursor);
