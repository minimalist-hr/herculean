using Herculean.Account.Application.Users.SignOutUser;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.UnitTests.Application.Users.SignOutUser;

public sealed class SignOutUserHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 11, 12, 0, 0, TimeSpan.Zero);

    private readonly User _user = User.Create("ana@example.com", "hash", "Europe/Zagreb");
    private readonly User _admin = User.CreateAdmin("admin@minimalist.hr", "hash");
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly SignOutUserHandler _handler;

    public SignOutUserHandlerTests()
    {
        _userRepository.Add(_user);
        _userRepository.Add(_admin);
        _handler = new SignOutUserHandler(_userRepository, _unitOfWork);
    }

    private Task<Result> RunAsync(User user) => _handler.HandleAsync(user.Id.Value, TestContext.Current.CancellationToken);

    [Fact]
    public async Task AnAdminIsNotFound()
    {
        (await RunAsync(_admin)).Error.ShouldBe(UserErrors.NotFound);
    }

    [Fact]
    public async Task AnUnknownUserIsNotFound()
    {
        Result result = await _handler.HandleAsync(Guid.CreateVersion7(), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.NotFound);
    }

    [Fact]
    public async Task EveryDeviceIsSignedOut()
    {
        _user.AddRefreshToken("hash:phone", Now.AddDays(1));
        _user.AddRefreshToken("hash:tablet", Now.AddDays(1));

        Result result = await RunAsync(_user);

        result.IsSuccess.ShouldBeTrue();
        _user.RefreshTokens.ShouldBeEmpty();
        _unitOfWork.Saved.ShouldBeTrue();
    }
}
