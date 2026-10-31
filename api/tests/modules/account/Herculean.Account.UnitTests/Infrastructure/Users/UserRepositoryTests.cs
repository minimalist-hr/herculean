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

    public void Dispose()
    {
        _dbContext.Dispose();
        _outboxSignal.Dispose();
    }
}
