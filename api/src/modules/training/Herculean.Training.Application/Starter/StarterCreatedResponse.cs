using System.ComponentModel;

namespace Herculean.Training.Application.Starter;

[Description("The new starter group or exercise.")]
internal sealed record StarterCreatedResponse(
    [property: Description("Its ID.")] Guid Id);
