using System.ComponentModel;

namespace Herculean.Training.Application.Exercises.UpdateExercise;

[Description("The new values of an exercise. They replace the old ones.")]
internal sealed record UpdateExerciseRequest(
    [property: Description("The name, 1 to 100 characters. Spaces around it are removed. It must differ from the user's other exercises, regardless of case.")] string Name,
    [property: Description("The group it belongs to, which orders the exercise list.")] Guid GroupId,
    [property: Description("Other groups it also works. Leaving it out clears them. It can't repeat a group, or include the group it belongs to.")] List<Guid>? AlsoWorksGroupIds) : IExerciseFields;
