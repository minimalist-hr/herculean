using Herculean.Account.Application.Users.ListUsers;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure;
using Herculean.Account.Infrastructure.Users;
using Herculean.SharedKernel.Events;
using Herculean.SharedKernel.Results;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Account.UnitTests.Application.Users.ListUsers;

public sealed class ListUsersHandlerTests : IDisposable
{
    private static readonly DateTimeOffset Now = new(2026, 11, 11, 12, 0, 0, TimeSpan.Zero);
    private readonly AccountDbContext _dbContext = new(
        new DbContextOptionsBuilder<AccountDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
        new OutboxSignal<AccountDbContext>());

    [Fact]
    public async Task UsersShowNewestFirstWithoutAdmins()
    {
        User ana = await SaveUserAsync("ana@example.com", Now.AddDays(-2));
        ana.ChangeName("Ana");
        ana.MarkActive(Now.AddHours(-1));
        await _dbContext.SaveChangesAsync(Token);
        await SaveUserAsync("ivo@example.com", Now.AddDays(-1));
        await SaveAsync(User.CreateAdmin("admin@minimalist.hr", "hash"), Now);

        UsersPageResponse page = await ListAsync(new ListUsersRequest(null, null, null));

        page.Users.Select(user => user.Email).ShouldBe(["ivo@example.com", "ana@example.com"]);
        page.Users[1].Name.ShouldBe("Ana");
        page.Users[1].LastActiveAtUtc.ShouldBe(Now.AddHours(-1));
        page.NextCursor.ShouldBeNull();
    }

    [Fact]
    public async Task UsersComeTwentyAPage()
    {
        for (int day = 1; day <= ListUsersHandler.PageSize + 1; day++)
        {
            await SaveUserAsync($"user{day}@example.com", Now.AddDays(-day));
        }

        UsersPageResponse first = await ListAsync(new ListUsersRequest(null, null, null));
        UsersPageResponse second = await ListAsync(new ListUsersRequest(null, null, first.NextCursor));

        first.Users.Count.ShouldBe(ListUsersHandler.PageSize);
        first.NextCursor.ShouldNotBeNull();
        second.Users.ShouldHaveSingleItem().Email.ShouldBe("user21@example.com");
        second.NextCursor.ShouldBeNull();
    }

    [Fact]
    public async Task DeletingSoonShowsOnlyThoseAccountsSoonestFirst()
    {
        User later = await SaveUserAsync("later@example.com", Now.AddDays(-5));
        User sooner = await SaveUserAsync("sooner@example.com", Now.AddDays(-1));
        await SaveUserAsync("staying@example.com", Now.AddDays(-3));
        later.ScheduleDeletion(Now);
        sooner.ScheduleDeletion(Now.AddDays(-2));
        await _dbContext.SaveChangesAsync(Token);

        UsersPageResponse page = await ListAsync(new ListUsersRequest(null, true, null));

        page.Users.Select(user => user.Email).ShouldBe(["sooner@example.com", "later@example.com"]);
        page.Users[0].DeletionScheduledForUtc.ShouldBe(Now.AddDays(12));
        page.Users[0].Closed.ShouldBeFalse();
    }

    [Fact]
    public async Task ARowSaysWhetherTheAccountIsClosedOrHasAPhoto()
    {
        User closed = await SaveUserAsync("closed@example.com", Now.AddDays(-1));
        closed.Close(Now);
        closed.SetPhoto([1]);
        await _dbContext.SaveChangesAsync(Token);

        UserListItemResponse row = (await ListAsync(new ListUsersRequest(null, null, null))).Users.ShouldHaveSingleItem();

        row.Closed.ShouldBeTrue();
        row.HasPhoto.ShouldBeTrue();
    }

    [Fact]
    public async Task ABrokenCursorIsNotValid()
    {
        Result<UsersPageResponse> result = await Handler().HandleAsync(new ListUsersRequest(null, null, "yesterday"), Token);

        result.Error.ShouldNotBeNull().Fields["cursor"].ShouldBe(["Cursor must be a nextCursor from an earlier page."]);
    }

    [Fact]
    public async Task ATooLongSearchIsNotValid()
    {
        Result<UsersPageResponse> result = await Handler().HandleAsync(
            new ListUsersRequest(new string('a', ListUsersValidator.SearchMaxLength + 1), null, null), Token);

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("search");
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }

    private static CancellationToken Token => TestContext.Current.CancellationToken;

    private ListUsersHandler Handler() => new(new ListUsersValidator(), new UserReadRepository(_dbContext));

    private async Task<UsersPageResponse> ListAsync(ListUsersRequest request) => (await Handler().HandleAsync(request, Token)).Value;

    private async Task<User> SaveUserAsync(string email, DateTimeOffset createdAtUtc)
    {
        User user = User.Create(email, "hash", "Europe/Zagreb");
        await SaveAsync(user, createdAtUtc);
        return user;
    }

    private async Task SaveAsync(User user, DateTimeOffset createdAtUtc)
    {
        _dbContext.Users.Add(user);
        _dbContext.Entry(user).Property(saved => saved.CreatedAtUtc).CurrentValue = createdAtUtc;
        await _dbContext.SaveChangesAsync(Token);
    }
}
