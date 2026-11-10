using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Application.Workouts.UpdateWorkoutExerciseSuperset;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Application.Workouts.UpdateWorkoutExerciseSuperset;

public sealed class UpdateWorkoutExerciseSupersetHandlerTests
{
    private static readonly UserId User = UserId.From(Guid.CreateVersion7());

    private readonly FakeWorkoutRepository _workoutRepository = new();
    private readonly FakeWorkoutReadRepository _workoutReadRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly UpdateWorkoutExerciseSupersetHandler _handler;
    private readonly Workout _workout;

    public UpdateWorkoutExerciseSupersetHandlerTests()
    {
        _workout = Workout.Start(
            User,
            new DateOnly(2026, 11, 11),
            RoutineId.New(),
            "Upper",
            [new RoutineExerciseValues(ExerciseId.New(), 2, 8, 10), new RoutineExerciseValues(ExerciseId.New(), 2, 8, 10)],
            new Dictionary<ExerciseId, List<SetValues>>(),
            null);
        _workoutRepository.Add(_workout);
        _workoutReadRepository.Workout = new WorkoutDetailsResponse(_workout.Id.Value, _workout.Date, _workout.Status, _workout.Name, null, []);
        _handler = new UpdateWorkoutExerciseSupersetHandler(new UpdateWorkoutExerciseSupersetValidator(), _workoutRepository, _workoutReadRepository, _unitOfWork);
    }

    private Task<Result<WorkoutDetailsResponse>> HandleAsync(Guid workoutId, int index, bool supersetWithNext) =>
        _handler.HandleAsync(workoutId, _workout.Exercises[index].Id.Value, new UpdateWorkoutExerciseSupersetRequest(supersetWithNext), TestContext.Current.CancellationToken);

    [Fact]
    public async Task PairsAnExerciseWithTheNextAndSaves()
    {
        Result<WorkoutDetailsResponse> result = await HandleAsync(_workout.Id.Value, 0, true);

        result.Value.Id.ShouldBe(_workout.Id.Value);
        _workout.Exercises[0].SupersetWithNext.ShouldBeTrue();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task TheLastExerciseCanNotStartOne()
    {
        Result<WorkoutDetailsResponse> result = await HandleAsync(_workout.Id.Value, 1, true);

        result.Error.ShouldBe(WorkoutErrors.SupersetNotTwo);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AnUnknownWorkoutIsNotFound()
    {
        Result<WorkoutDetailsResponse> result = await HandleAsync(Guid.CreateVersion7(), 0, true);

        result.Error.ShouldBe(WorkoutErrors.NotFound);
    }
}
