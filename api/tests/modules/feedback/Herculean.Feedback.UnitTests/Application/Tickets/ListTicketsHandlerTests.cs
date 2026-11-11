using Herculean.Feedback.Application.Tickets.ListTickets;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Tickets;

namespace Herculean.Feedback.UnitTests.Application.Tickets;

public sealed class ListTicketsHandlerTests : IDisposable
{
    private static readonly DateTimeOffset Monday = new(2026, 11, 9, 9, 0, 0, TimeSpan.Zero);
    private readonly FeedbackDatabase _database = new();
    private readonly ListTicketsHandler _handler;

    public ListTicketsHandlerTests()
    {
        _handler = new ListTicketsHandler(new TicketReadRepository(_database.DbContext));
    }

    [Fact]
    public async Task NoTicketsIsAnEmptyList()
    {
        (await _handler.HandleAsync(FeedbackDatabase.Token)).ShouldBeEmpty();
    }

    [Fact]
    public async Task TheTicketWithTheLatestMessageComesFirst()
    {
        Ticket older = await _database.SaveTicketAsync(message: "First", createdAtUtc: Monday);
        Ticket newer = await _database.SaveTicketAsync(message: "Second", createdAtUtc: Monday.AddDays(1));
        await _database.SaveMessageAsync(older, MessageAuthor.Admin, "Thanks", Monday.AddDays(2));

        List<TicketListItemResponse> tickets = await _handler.HandleAsync(FeedbackDatabase.Token);

        tickets.Select(ticket => ticket.Id).ShouldBe([older.Id.Value, newer.Id.Value]);
        tickets[0].Preview.ShouldBe("First");
        tickets[0].LastMessageAtUtc.ShouldBe(Monday.AddDays(2));
        tickets[0].Type.ShouldBe(TicketType.Bug);
    }

    [Fact]
    public async Task TheStatusAndUnreadReplyShow()
    {
        await _database.SaveTicketAsync(status: TicketStatus.Answered, hasUnreadReply: true);

        TicketListItemResponse ticket = (await _handler.HandleAsync(FeedbackDatabase.Token)).ShouldHaveSingleItem();

        ticket.Status.ShouldBe(TicketStatus.Answered);
        ticket.HasUnreadReply.ShouldBeTrue();
    }

    [Fact]
    public async Task ALongFirstMessageIsCutTo200Characters()
    {
        await _database.SaveTicketAsync(message: new string('a', 300));

        TicketListItemResponse ticket = (await _handler.HandleAsync(FeedbackDatabase.Token)).ShouldHaveSingleItem();

        ticket.Preview.Length.ShouldBe(TicketReadRepository.PreviewMaxLength);
    }

    [Fact]
    public async Task AnotherUsersTicketsDoNotShow()
    {
        await _database.SaveTicketAsync(userId: UserId.From(Guid.CreateVersion7()));

        (await _handler.HandleAsync(FeedbackDatabase.Token)).ShouldBeEmpty();
    }

    public void Dispose()
    {
        _database.Dispose();
    }
}
