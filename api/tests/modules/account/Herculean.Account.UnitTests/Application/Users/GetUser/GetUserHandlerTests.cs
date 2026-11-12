using Herculean.Account.Application.Users.GetUser;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure;
using Herculean.Account.Infrastructure.Users;
using Herculean.SharedKernel.Events;
using Herculean.SharedKernel.Results;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Account.UnitTests.Application.Users.GetUser;

public sealed class GetUserHandlerTests : IDisposable
{
    private static readonly DateTimeOffset Now = new(2026, 11, 11, 12, 0, 0, TimeSpan.Zero);
    private readonly AccountDbContext _dbContext = new(
        new DbContextOptionsBuilder<AccountDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
        new OutboxSignal<AccountDbContext>());

    [Fact]
    public async Task TheUsersAccountIsReturned()
    {
        User user = User.Create("ana@example.com", "hash", "Europe/Zagreb");
        user.ChangeName("Ana");
        user.MarkActive(Now);
        user.ScheduleDeletion(Now);
        await SaveAsync(user);

        Result<AdminUserResponse> result = await GetAsync(user.Id.Value);

        result.Value.ShouldBe(new AdminUserResponse(user.Id.Value, "Ana", "ana@example.com", user.CreatedAtUtc, Now, Now.AddDays(14), false, false));
    }

    [Fact]
    public async Task AnAdminIsNotFound()
    {
        User admin = User.CreateAdmin("admin@minimalist.hr", "hash");
        await SaveAsync(admin);

        (await GetAsync(admin.Id.Value)).Error.ShouldBe(UserErrors.NotFound);
    }

    [Fact]
    public async Task AnUnknownUserIsNotFound()
    {
        (await GetAsync(Guid.CreateVersion7())).Error.ShouldBe(UserErrors.NotFound);
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }

    private Task<Result<AdminUserResponse>> GetAsync(Guid id) =>
        new GetUserHandler(new UserReadRepository(_dbContext)).HandleAsync(id, TestContext.Current.CancellationToken);

    private async Task SaveAsync(User user)
    {
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
    }
}
