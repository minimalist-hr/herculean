using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure;
using Herculean.Account.Infrastructure.Users;
using Herculean.SharedKernel.Events;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Account.UnitTests.Infrastructure.Users;

public sealed class UserRepositoryTests : IDisposable
{
    private readonly OutboxSignal<AccountDbContext> _outboxSignal = new();
    private readonly AccountDbContext _dbContext;
    private readonly UserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UserRepositoryTests()
    {
        _dbContext = new AccountDbContext(
            new DbContextOptionsBuilder<AccountDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
            _outboxSignal);
        _userRepository = new UserRepository(_dbContext);
        _unitOfWork = _dbContext;
    }

    [Fact]
    public async Task AddedUserIsSavedWithItsRefreshToken()
    {
        User newUser = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        newUser.AddRefreshToken("token-hash", DateTimeOffset.UnixEpoch);

        _userRepository.Add(newUser);
        await _unitOfWork.SaveChangesAsync(TestContext.Current.CancellationToken);

        _dbContext.ChangeTracker.Clear();
        User savedUser = await _dbContext.Users.Include(user => user.RefreshTokens).SingleAsync(TestContext.Current.CancellationToken);
        savedUser.Email.ShouldBe("filip@example.com");
        savedUser.RefreshTokens.ShouldHaveSingleItem().TokenHash.ShouldBe("token-hash");
    }

    [Theory]
    [InlineData("filip@example.com")]
    [InlineData(" Filip@Example.COM ")]
    public async Task EmailExistsRegardlessOfCase(string email)
    {
        _userRepository.Add(User.Create("filip@example.com", "hash", "Europe/Zagreb"));
        await _unitOfWork.SaveChangesAsync(TestContext.Current.CancellationToken);

        (await _userRepository.EmailExistsAsync(email, TestContext.Current.CancellationToken)).ShouldBeTrue();
    }

    [Fact]
    public async Task OtherEmailDoesNotExist()
    {
        (await _userRepository.EmailExistsAsync("filip@example.com", TestContext.Current.CancellationToken)).ShouldBeFalse();
    }

    [Fact]
    public async Task UserIsFoundByItsId()
    {
        User newUser = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        _userRepository.Add(newUser);
        await _unitOfWork.SaveChangesAsync(TestContext.Current.CancellationToken);

        (await _userRepository.GetByIdAsync(newUser.Id, TestContext.Current.CancellationToken)).ShouldBe(newUser);
        (await _userRepository.GetByIdAsync(UserId.New(), TestContext.Current.CancellationToken)).ShouldBeNull();
    }

    [Fact]
    public async Task UserIsFoundByEmailRegardlessOfCase()
    {
        User newUser = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        _userRepository.Add(newUser);
        await _unitOfWork.SaveChangesAsync(TestContext.Current.CancellationToken);

        (await _userRepository.GetByEmailAsync(" Filip@Example.COM ", TestContext.Current.CancellationToken)).ShouldBe(newUser);
        (await _userRepository.GetByEmailAsync("other@example.com", TestContext.Current.CancellationToken)).ShouldBeNull();
    }

    [Fact]
    public async Task UserIsFoundByRefreshTokenWithOnlyThatTokenLoaded()
    {
        User newUser = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        newUser.AddRefreshToken("first", DateTimeOffset.UnixEpoch);
        newUser.AddRefreshToken("second", DateTimeOffset.UnixEpoch);
        _userRepository.Add(newUser);
        await _unitOfWork.SaveChangesAsync(TestContext.Current.CancellationToken);
        _dbContext.ChangeTracker.Clear();

        User? found = await _userRepository.GetByRefreshTokenHashAsync("second", TestContext.Current.CancellationToken);

        found.ShouldNotBeNull().RefreshTokens.ShouldHaveSingleItem().TokenHash.ShouldBe("second");
        (await _userRepository.GetByRefreshTokenHashAsync("unknown", TestContext.Current.CancellationToken)).ShouldBeNull();
    }

    [Fact]
    public async Task RemovedRefreshTokenIsDeletedOnSave()
    {
        User newUser = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        newUser.AddRefreshToken("token-hash", DateTimeOffset.UnixEpoch);
        _userRepository.Add(newUser);
        await _unitOfWork.SaveChangesAsync(TestContext.Current.CancellationToken);

        newUser.RemoveRefreshToken(newUser.RefreshTokens[0]);
        await _unitOfWork.SaveChangesAsync(TestContext.Current.CancellationToken);

        _dbContext.ChangeTracker.Clear();
        (await _userRepository.GetByRefreshTokenHashAsync("token-hash", TestContext.Current.CancellationToken)).ShouldBeNull();
    }

    [Fact]
    public async Task FindsTheUserByEmailWithTheirPasswordResetTokens()
    {
        User newUser = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        newUser.AddPasswordResetToken("token-hash", DateTimeOffset.UnixEpoch);
        _userRepository.Add(newUser);
        await _unitOfWork.SaveChangesAsync(TestContext.Current.CancellationToken);
        _dbContext.ChangeTracker.Clear();

        User? user = await _userRepository.GetByEmailWithPasswordResetTokensAsync(" Filip@Example.COM ", TestContext.Current.CancellationToken);

        user.ShouldNotBeNull().PasswordResetTokens.ShouldHaveSingleItem().TokenHash.ShouldBe("token-hash");
    }

    [Fact]
    public async Task FindsTheUserByPasswordResetTokenWithAllTheirTokens()
    {
        User newUser = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        newUser.AddPasswordResetToken("token-hash", DateTimeOffset.UnixEpoch);
        newUser.AddRefreshToken("phone", DateTimeOffset.UnixEpoch);
        newUser.AddRefreshToken("tablet", DateTimeOffset.UnixEpoch);
        _userRepository.Add(newUser);
        await _unitOfWork.SaveChangesAsync(TestContext.Current.CancellationToken);
        _dbContext.ChangeTracker.Clear();

        User? user = await _userRepository.GetByPasswordResetTokenHashAsync("token-hash", TestContext.Current.CancellationToken);

        user.ShouldNotBeNull().PasswordResetTokens.ShouldHaveSingleItem();
        user.RefreshTokens.Count.ShouldBe(2);
        (await _userRepository.GetByPasswordResetTokenHashAsync("unknown", TestContext.Current.CancellationToken)).ShouldBeNull();
    }

    [Fact]
    public async Task ResetPasswordDeletesEveryTokenOnSave()
    {
        User newUser = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        newUser.AddPasswordResetToken("token-hash", DateTimeOffset.UnixEpoch);
        newUser.AddRefreshToken("phone", DateTimeOffset.UnixEpoch);
        _userRepository.Add(newUser);
        await _unitOfWork.SaveChangesAsync(TestContext.Current.CancellationToken);
        _dbContext.ChangeTracker.Clear();

        User user = (await _userRepository.GetByPasswordResetTokenHashAsync("token-hash", TestContext.Current.CancellationToken)).ShouldNotBeNull();
        user.ResetPassword("new-hash");
        await _unitOfWork.SaveChangesAsync(TestContext.Current.CancellationToken);

        (await _dbContext.Set<PasswordResetToken>().CountAsync(TestContext.Current.CancellationToken)).ShouldBe(0);
        (await _dbContext.Set<RefreshToken>().CountAsync(TestContext.Current.CancellationToken)).ShouldBe(0);
    }

    public void Dispose()
    {
        _dbContext.Dispose();
        _outboxSignal.Dispose();
    }
}
