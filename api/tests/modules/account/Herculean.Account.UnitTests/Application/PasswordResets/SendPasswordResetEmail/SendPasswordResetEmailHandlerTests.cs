using Herculean.Account.Application.PasswordResets.SendPasswordResetEmail;
using Herculean.Account.Domain.Users;

namespace Herculean.Account.UnitTests.Application.PasswordResets.SendPasswordResetEmail;

public sealed class SendPasswordResetEmailHandlerTests
{
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeEmailSender _emailSender = new();
    private readonly SendPasswordResetEmailHandler _handler;

    public SendPasswordResetEmailHandlerTests()
    {
        _handler = new SendPasswordResetEmailHandler(_userRepository, _unitOfWork, new FakePasswordResetTokenIssuer(), _emailSender);
    }

    [Fact]
    public async Task KnownEmailGetsATokenAndAnEmail()
    {
        User user = User.Create("filip@example.com", "hashed:password", "Europe/Zagreb");
        _userRepository.Add(user);

        await _handler.HandleAsync("Filip@Example.com", TestContext.Current.CancellationToken);

        user.PasswordResetTokens.ShouldHaveSingleItem().TokenHash.ShouldBe($"hash:{FakePasswordResetTokenIssuer.Token}");
        _unitOfWork.Saved.ShouldBeTrue();
        _emailSender.Sent.TryRead(out SentEmail? sent).ShouldBeTrue();
        sent.ShouldBe(new SentEmail("filip@example.com", FakePasswordResetTokenIssuer.Token));
    }

    [Fact]
    public async Task UnknownEmailGetsNothing()
    {
        await _handler.HandleAsync("nobody@example.com", TestContext.Current.CancellationToken);

        _unitOfWork.Saved.ShouldBeFalse();
        _emailSender.Sent.TryRead(out _).ShouldBeFalse();
    }
}
