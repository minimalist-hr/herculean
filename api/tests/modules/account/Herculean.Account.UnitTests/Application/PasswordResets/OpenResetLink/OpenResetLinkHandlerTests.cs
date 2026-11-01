using Herculean.Account.Application.PasswordResets.OpenResetLink;
using Herculean.Account.Domain.Users;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Application.PasswordResets.OpenResetLink;

public sealed class OpenResetLinkHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 1, 12, 0, 0, TimeSpan.Zero);

    private readonly FakeUserRepository _userRepository = new();
    private readonly User _user = User.Create("filip@example.com", "hashed:password", "Europe/Zagreb");
    private readonly OpenResetLinkHandler _handler;

    public OpenResetLinkHandlerTests()
    {
        _userRepository.Add(_user);
        _handler = new OpenResetLinkHandler(_userRepository, new FakePasswordResetTokenIssuer(), new FakeResetLinks(), new FakeTimeProvider(Now));
    }

    [Fact]
    public async Task ValidTokenLeadsToNewPasswordAndStaysUsable()
    {
        _user.AddPasswordResetToken("hash:token", Now.AddMinutes(1));

        string appLink = await _handler.HandleAsync("token", TestContext.Current.CancellationToken);

        appLink.ShouldBe("new-password:token:filip@example.com");
        _user.PasswordResetTokens.ShouldHaveSingleItem();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("unknown")]
    public async Task MissingOrUnknownTokenLeadsToExpired(string? token)
    {
        string appLink = await _handler.HandleAsync(token, TestContext.Current.CancellationToken);

        appLink.ShouldBe(FakeResetLinks.ExpiredLink);
    }

    [Fact]
    public async Task ExpiredTokenLeadsToExpired()
    {
        _user.AddPasswordResetToken("hash:token", Now);

        string appLink = await _handler.HandleAsync("token", TestContext.Current.CancellationToken);

        appLink.ShouldBe(FakeResetLinks.ExpiredLink);
    }
}
