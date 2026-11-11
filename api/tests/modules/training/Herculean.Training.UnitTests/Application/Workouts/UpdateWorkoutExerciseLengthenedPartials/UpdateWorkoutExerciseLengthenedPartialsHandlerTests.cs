using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Application.Workouts.UpdateWorkoutExerciseLengthenedPartials;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Application.Workouts.UpdateWorkoutExerciseLengthenedPartials;

public sealed class UpdateWorkoutExerciseLengthenedPartialsHandlerTests
{
    private readonly FakeWorkoutRepository _workoutRepository = new();
    private readonly FakeWorkoutReadRepository _workoutReadRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly UpdateWorkoutExerciseLengthenedPartialsHandler _handler;
    private readonly Workout _workout;

    public UpdateWorkoutExerciseLengthenedPartialsHandlerTests()
    {
        _workout = Workout.Start(
            UserId.From(Guid.CreateVersion7()),
            new DateOnly(2026, 11, 11),
            RoutineId.New(),
            "Legs",
            [new RoutineExerciseValues(ExerciseId.New(), 2, 8, 10)],
            new Dictionary<ExerciseId, List<SetValues>>(),
            null);
        _workoutRepository.Add(_workout);
        _workoutReadRepository.Workout = new WorkoutDetailsResponse(_workout.Id.Value, _workout.Date, _workout.Status, _workout.Name, null, []);
        _handler = new UpdateWorkoutExerciseLengthenedPartialsHandler(new UpdateWorkoutExerciseLengthenedPartialsValidator(), _workoutRepository, _workoutReadRepository, _unitOfWork);
    }

    private Task<Result<WorkoutDetailsResponse>> HandleAsync(Guid workoutId, bool on) =>
        _handler.HandleAsync(workoutId, _workout.Exercises[0].Id.Value, new UpdateWorkoutExerciseLengthenedPartialsRequest(on), TestContext.Current.CancellationToken);

    [Fact]
    public async Task TurnsThemOnAndSaves()
    {
        Result<WorkoutDetailsResponse> result = await HandleAsync(_workout.Id.Value, true);

        result.IsSuccess.ShouldBeTrue();
        _workout.Exercises[0].LengthenedPartials.ShouldBeTrue();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AnUnknownWorkoutIsNotFound()
    {
        Result<WorkoutDetailsResponse> result = await HandleAsync(Guid.CreateVersion7(), true);

        result.Error.ShouldBe(WorkoutErrors.NotFound);
    }
}
