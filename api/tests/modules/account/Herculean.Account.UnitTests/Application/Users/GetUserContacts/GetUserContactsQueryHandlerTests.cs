using Herculean.Account.Application.Users.GetUserContacts;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure;
using Herculean.Account.Infrastructure.Users;
using Herculean.SharedKernel.Events;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Account.UnitTests.Application.Users.GetUserContacts;

public sealed class GetUserContactsQueryHandlerTests : IDisposable
{
    private readonly AccountDbContext _dbContext = new(
        new DbContextOptionsBuilder<AccountDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
        new OutboxSignal<AccountDbContext>());

    [Fact]
    public async Task EachUserAskedForComesBackWithNameAndEmail()
    {
        User named = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        named.ChangeName("Filip");
        User unnamed = User.Create("new@example.com", "hash", "Europe/Zagreb");
        _dbContext.Users.AddRange(named, unnamed, User.Create("other@example.com", "hash", "Europe/Zagreb"));
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        GetUserContactsQueryHandler handler = new(new UserReadRepository(_dbContext));

        IReadOnlyList<UserContact> contacts = await handler.HandleAsync(
            new GetUserContactsQuery([named.Id.Value, unnamed.Id.Value, Guid.CreateVersion7()]),
            TestContext.Current.CancellationToken);

        contacts.ShouldBe(
            [new UserContact(named.Id.Value, "Filip", "filip@example.com"), new UserContact(unnamed.Id.Value, null, "new@example.com")],
            ignoreOrder: true);
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
