using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Exercises;
using Herculean.Training.Application.Exercises.RestoreExercise;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.UnitTests.Application.Exercises.RestoreExercise;

public sealed class RestoreExerciseHandlerTests
{
    private static readonly UserId User = UserId.From(Guid.CreateVersion7());

    private readonly FakeExerciseRepository _exerciseRepository = new();
    private readonly FakeGroupRepository _groupRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly RestoreExerciseHandler _handler;
    private readonly Group _chest;
    private readonly Group _arms;
    private readonly Exercise _exercise;

    public RestoreExerciseHandlerTests()
    {
        List<Group> groups = [.. TestGroups.Create(User)];
        _chest = groups[0];
        _arms = groups[1];
        _groupRepository.AddRange(groups);
        _exercise = Exercise.Create(User, "Bench press", _chest.Id, [_arms.Id]);
        _exercise.Delete(DateTimeOffset.UnixEpoch);
        _exerciseRepository.Add(_exercise);
        _handler = new RestoreExerciseHandler(_exerciseRepository, _groupRepository, _unitOfWork);
    }

    private static CancellationToken Token => TestContext.Current.CancellationToken;

    [Fact]
    public async Task ADeletedExerciseComesBack()
    {
        Result<ExerciseResponse> result = await _handler.HandleAsync(_exercise.Id.Value, Token);

        result.Value.Name.ShouldBe("Bench press");
        _exercise.DeletedAtUtc.ShouldBeNull();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AnExerciseThatIsNotDeletedIsNotFound()
    {
        _exercise.Restore();

        Result<ExerciseResponse> result = await _handler.HandleAsync(_exercise.Id.Value, Token);

        result.Error.ShouldBe(ExerciseErrors.NotFound);
    }

    [Fact]
    public async Task ItsNameTakenSinceKeepsItDeleted()
    {
        _exerciseRepository.Add(Exercise.Create(User, "bench press", _chest.Id, []));

        Result<ExerciseResponse> result = await _handler.HandleAsync(_exercise.Id.Value, Token);

        result.Error.ShouldBe(ExerciseErrors.NameTaken);
        _exercise.DeletedAtUtc.ShouldNotBeNull();
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task ItsGroupDeletedSinceKeepsItDeleted()
    {
        _chest.Delete(DateTimeOffset.UnixEpoch);

        Result<ExerciseResponse> result = await _handler.HandleAsync(_exercise.Id.Value, Token);

        result.Error.ShouldBe(GroupErrors.NotFound);
        _exercise.DeletedAtUtc.ShouldNotBeNull();
    }

    [Fact]
    public async Task AnAlsoWorksGroupDeletedSinceKeepsItDeleted()
    {
        _arms.Delete(DateTimeOffset.UnixEpoch);

        Result<ExerciseResponse> result = await _handler.HandleAsync(_exercise.Id.Value, Token);

        result.Error.ShouldBe(GroupErrors.NotFound);
    }
}
