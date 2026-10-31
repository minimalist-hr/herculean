using Herculean.SharedKernel.Results;

namespace Herculean.SharedKernel.UnitTests.Results;

public sealed class ResultTests
{
    private static readonly Error NotFound = Error.NotFound("routine.not_found", "The routine was not found.");

    [Fact]
    public void SuccessHasNoError()
    {
        Result result = Result.Success();

        result.IsSuccess.ShouldBeTrue();
        result.Error.ShouldBeNull();
    }

    [Fact]
    public void FailureHasItsError()
    {
        Result result = Result.Failure(NotFound);

        result.IsSuccess.ShouldBeFalse();
        result.Error.ShouldBe(NotFound);
    }

    [Fact]
    public void ErrorConvertsToFailure()
    {
        Result result = NotFound;

        result.Error.ShouldBe(NotFound);
    }

    [Fact]
    public void SuccessWithValueHasThatValue()
    {
        Result<int> result = 42;

        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBe(42);
    }

    [Fact]
    public void FailureWithValueTypeHasItsError()
    {
        Result<int> result = NotFound;

        result.IsSuccess.ShouldBeFalse();
        result.Error.ShouldBe(NotFound);
    }

    [Fact]
    public void FailureHasNoValue()
    {
        Result<int> result = NotFound;

        Should.Throw<InvalidOperationException>(() => result.Value);
    }
}
