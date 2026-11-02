using System.ComponentModel;

namespace Herculean.Training.Application.Routines.CreateRoutine;

[Description("A new routine.")]
internal sealed record CreateRoutineRequest(
    [property: Description("The name, 1 to 100 characters. Spaces around it are removed. It must differ from the user's other routines, regardless of case.")] string Name,
    [property: Description("Its exercises in order, 1 to 30, each once.")] List<RoutineExerciseItem> Exercises) : IRoutineFields;
