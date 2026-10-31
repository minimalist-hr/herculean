using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure;
using Herculean.Account.Infrastructure.Users;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Account.UnitTests.Infrastructure.Users;

public sealed class UserRepositoryTests : IDisposable
{
    private readonly AccountDbContext _dbContext = new(new DbContextOptionsBuilder<AccountDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString())
        .Options);

    private readonly UserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UserRepositoryTests()
    {
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

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
