using Herculean.Account.Application.Auth;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Auth;

namespace Herculean.Account.UnitTests.Application;

internal sealed class FakeCurrentUserAccessor : ICurrentUserAccessor
{
    public Guid UserId { get; set; } = Guid.CreateVersion7();
}

internal sealed class FakeUserRepository : IUserRepository
{
    public List<User> Users { get; } = [];

    public Task<User?> GetByIdAsync(UserId userId, CancellationToken cancellationToken) =>
        Task.FromResult(Users.SingleOrDefault(user => user.Id == userId));

    public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken) =>
        Task.FromResult(Users.Any(user => user.Email == User.NormalizeEmail(email)));

    public void Add(User user)
    {
        Users.Add(user);
    }
}

internal sealed class FakeUnitOfWork : IUnitOfWork
{
    public bool Saved { get; private set; }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        Saved = true;

        return Task.CompletedTask;
    }
}

internal sealed class FakeOutbox : IOutbox
{
    public List<object> Events { get; } = [];

    public void Add<TEvent>(TEvent @event)
        where TEvent : class
    {
        Events.Add(@event);
    }
}

internal sealed class FakePasswordHasher : IPasswordHasher
{
    public string Hash(string password) => $"hashed:{password}";
}

internal sealed class FakeTokenIssuer : ITokenIssuer
{
    public static readonly TokenResponse TokenResponse = new("access", 900, "refresh");

    public TokenResponse Issue(User user)
    {
        user.AddRefreshToken("refresh-hash", DateTimeOffset.UnixEpoch);

        return TokenResponse;
    }
}
