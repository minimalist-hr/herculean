using Herculean.Feedback.Application.Auth;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure;
using Herculean.SharedKernel.Auth;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.UnitTests;

/// <summary>An in-memory Feedback database, signed in as one user, with helpers to save tickets.</summary>
internal sealed class FeedbackDatabase : IDisposable
{
    /// <summary>The smallest JPEG start the rule accepts.</summary>
    public static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0];

    private readonly string _name = Guid.NewGuid().ToString();
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();

    public FeedbackDatabase()
    {
        DbContext = CreateDbContext(_currentUserAccessor);
    }

    public FeedbackDbContext DbContext { get; }

    public UserId UserId => UserId.From(_currentUserAccessor.UserId);

    public CurrentUser CurrentUser => new(_currentUserAccessor);

    public static CancellationToken Token => TestContext.Current.CancellationToken;

    public static DeviceInfo Device => new("1.0.0", "Google Pixel 8", "Android 15");

    /// <summary>The same database, signed in as another user.</summary>
    public FeedbackDbContext CreateDbContextForAnotherUser() => CreateDbContext(new FakeCurrentUserAccessor());

    /// <summary>The same database with no signed-in user, as when an account is deleted.</summary>
    public FeedbackDbContext CreateDbContextWithNoUser() => CreateDbContext(new NoCurrentUserAccessor());

    /// <summary>Saves a ticket for a user, sent at a moment, and forgets it so that a read loads it fresh.</summary>
    public async Task<Ticket> SaveTicketAsync(
        UserId? userId = null,
        string message = "The timer stops.",
        DateTimeOffset? createdAtUtc = null,
        TicketStatus status = TicketStatus.Open,
        bool hasUnreadReply = false,
        int screenshots = 0)
    {
        Ticket ticket = Ticket.Create(userId ?? UserId, TicketType.Bug, message, Enumerable.Repeat(Jpeg, screenshots), Device);
        DbContext.Tickets.Add(ticket);
        DateTimeOffset sent = createdAtUtc ?? DateTimeOffset.UnixEpoch;
        DbContext.Entry(ticket).Property(saved => saved.CreatedAtUtc).CurrentValue = sent;
        DbContext.Entry(ticket.Messages[0]).Property(saved => saved.CreatedAtUtc).CurrentValue = sent;
        DbContext.Entry(ticket).Property(saved => saved.Status).CurrentValue = status;
        DbContext.Entry(ticket).Property(saved => saved.HasUnreadReply).CurrentValue = hasUnreadReply;
        await DbContext.SaveChangesAsync(Token);
        DbContext.ChangeTracker.Clear();

        return ticket;
    }

    /// <summary>Saves a message on a ticket, as Minimalist's replies will be.</summary>
    public async Task<TicketMessage> SaveMessageAsync(Ticket ticket, MessageAuthor author, string text, DateTimeOffset sentAtUtc, int screenshots = 0)
    {
        TicketMessage message = TicketMessage.Create(ticket.UserId, ticket.Id, author, text, Enumerable.Repeat(Jpeg, screenshots));
        DbContext.Add(message);
        DbContext.Entry(message).Property(saved => saved.CreatedAtUtc).CurrentValue = sentAtUtc;
        await DbContext.SaveChangesAsync(Token);
        DbContext.ChangeTracker.Clear();

        return message;
    }

    public Task<List<Ticket>> ListAllTicketsAsync() =>
        DbContext.Tickets.IgnoreQueryFilters().AsNoTracking().ToListAsync(Token);

    public Task<List<TicketMessage>> ListMessagesAsync(Ticket ticket) =>
        DbContext.Set<TicketMessage>().IgnoreQueryFilters().AsNoTracking()
            .Where(message => message.TicketId == ticket.Id)
            .Include(message => message.Screenshots)
            .OrderBy(message => message.CreatedAtUtc)
            .ToListAsync(Token);

    public void Dispose()
    {
        DbContext.Dispose();
    }

    private FeedbackDbContext CreateDbContext(ICurrentUserAccessor currentUserAccessor) => new(
        new DbContextOptionsBuilder<FeedbackDbContext>().UseInMemoryDatabase(_name).Options,
        new CurrentUser(currentUserAccessor));

    private sealed class FakeCurrentUserAccessor : ICurrentUserAccessor
    {
        public Guid UserId { get; } = Guid.CreateVersion7();
    }

    private sealed class NoCurrentUserAccessor : ICurrentUserAccessor
    {
        public Guid UserId => throw new InvalidOperationException("No user is signed in.");
    }
}
