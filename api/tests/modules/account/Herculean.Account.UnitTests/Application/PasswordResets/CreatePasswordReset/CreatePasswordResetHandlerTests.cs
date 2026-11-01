using Herculean.Account.Application.PasswordResets.CreatePasswordReset;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.UnitTests.Application.PasswordResets.CreatePasswordReset;

public sealed class CreatePasswordResetHandlerTests
{
    private readonly FakePasswordResetQueue _passwordResetQueue = new();
    private readonly CreatePasswordResetHandler _handler;

    public CreatePasswordResetHandlerTests()
    {
        _handler = new CreatePasswordResetHandler(new CreatePasswordResetValidator(), _passwordResetQueue);
    }

    [Fact]
    public async Task ValidEmailIsQueued()
    {
        Result result = await _handler.HandleAsync(new CreatePasswordResetRequest("filip@example.com"), TestContext.Current.CancellationToken);

        result.IsSuccess.ShouldBeTrue();
        _passwordResetQueue.Emails.ShouldHaveSingleItem().ShouldBe("filip@example.com");
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    public async Task InvalidEmailFailsWithAFieldErrorAndIsNotQueued(string email)
    {
        Result result = await _handler.HandleAsync(new CreatePasswordResetRequest(email), TestContext.Current.CancellationToken);

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
        result.Error.Fields.ShouldContainKey("email");
        _passwordResetQueue.Emails.ShouldBeEmpty();
    }
}
