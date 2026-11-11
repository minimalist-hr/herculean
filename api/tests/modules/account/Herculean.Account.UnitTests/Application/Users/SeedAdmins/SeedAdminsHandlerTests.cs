using Herculean.Account.Application.Users.SeedAdmins;
using Herculean.Account.Domain.Users;

using Microsoft.Extensions.Logging.Abstractions;

namespace Herculean.Account.UnitTests.Application.Users.SeedAdmins;

public sealed class SeedAdminsHandlerTests
{
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly SeedAdminsHandler _handler;

    public SeedAdminsHandlerTests()
    {
        _handler = new SeedAdminsHandler(_userRepository, new FakePasswordHasher(), _unitOfWork, NullLogger<SeedAdminsHandler>.Instance);
    }

    [Fact]
    public async Task EachAccountGetsAnAdminWithItsPassword()
    {
        await HandleAsync(new AdminCredentials(" Admin@Minimalist.hr ", "first password"), new AdminCredentials("support@minimalist.hr", "second password"));

        _userRepository.Users.Select(user => user.Email).ShouldBe(["admin@minimalist.hr", "support@minimalist.hr"]);
        _userRepository.Users.ShouldAllBe(user => user.IsAdmin && user.Name == null && user.TimeZone == User.AdminTimeZone);
        _userRepository.Users.Select(user => user.PasswordHash).ShouldBe(["hashed:first password", "hashed:second password"]);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task RunningAgainChangesNothing()
    {
        await HandleAsync(new AdminCredentials("admin@minimalist.hr", "password"));
        User admin = _userRepository.Users.ShouldHaveSingleItem();

        await HandleAsync(new AdminCredentials("admin@minimalist.hr", "password"), new AdminCredentials("ADMIN@minimalist.hr", "password"));

        _userRepository.Users.ShouldHaveSingleItem().ShouldBeSameAs(admin);
        admin.PasswordHash.ShouldBe("hashed:password");
    }

    [Fact]
    public async Task AChangedPasswordReplacesTheOldOne()
    {
        await HandleAsync(new AdminCredentials("admin@minimalist.hr", "old password"));

        await HandleAsync(new AdminCredentials("admin@minimalist.hr", "new password"));

        _userRepository.Users.ShouldHaveSingleItem().PasswordHash.ShouldBe("hashed:new password");
    }

    [Theory]
    [InlineData(" ", "password")]
    [InlineData("admin@minimalist.hr", "short")]
    public async Task AnAccountWithoutAnEmailOrAPasswordLongEnoughIsLeftOut(string email, string password)
    {
        await HandleAsync(new AdminCredentials(email, password));

        _userRepository.Users.ShouldBeEmpty();
    }

    [Fact]
    public async Task ARegularAccountWithTheEmailStaysAUser()
    {
        _userRepository.Add(User.Create("filip@minimalist.hr", "hash", "Europe/Zagreb"));

        await HandleAsync(new AdminCredentials("filip@minimalist.hr", "password"));

        User user = _userRepository.Users.ShouldHaveSingleItem();
        user.IsAdmin.ShouldBeFalse();
        user.PasswordHash.ShouldBe("hash");
    }

    private Task HandleAsync(params AdminCredentials[] admins) =>
        _handler.HandleAsync(admins, TestContext.Current.CancellationToken);
}
