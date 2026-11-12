using System.ComponentModel;

namespace Herculean.Training.Application.Stats.GetUserTraining;

[Description("A user's training, as counts only. Never what they logged.")]
internal sealed record UserTrainingResponse(
    [property: Description("Workouts they finished, deleted ones left out.")] int Workouts,
    [property: Description("Routines they have, deleted ones left out.")] int Routines);
