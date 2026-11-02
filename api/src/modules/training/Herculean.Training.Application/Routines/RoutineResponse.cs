using System.ComponentModel;

namespace Herculean.Training.Application.Routines;

[Description("A routine.")]
internal sealed record RoutineResponse(
    [property: Description("The routine's ID.")] Guid Id,
    [property: Description("The routine's name.")] string Name);
