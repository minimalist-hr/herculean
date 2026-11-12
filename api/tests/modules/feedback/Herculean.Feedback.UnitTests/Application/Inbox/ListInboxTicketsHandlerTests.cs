using Herculean.Account.Contracts;
using Herculean.Feedback.Application.Inbox.ListInboxTickets;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Inbox;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.UnitTests.Application.Inbox;

public sealed class ListInboxTicketsHandlerTests : IDisposable
{
    private static readonly DateTimeOffset Monday = new(2026, 11, 9, 9, 0, 0, TimeSpan.Zero);
    private readonly FeedbackDatabase _database = new();
    private readonly UserId _ana = UserId.From(Guid.CreateVersion7());
    private readonly UserId _ivo = UserId.From(Guid.CreateVersion7());
    private readonly ListInboxTicketsHandler _handler;

    public ListInboxTicketsHandlerTests()
    {
        _handler = new ListInboxTicketsHandler(
            new ListInboxTicketsValidator(),
            new InboxReadRepository(_database.DbContext),
            new FakeUserContacts(new UserContact(_ana.Value, "Ana", "ana@example.com"), new UserContact(_ivo.Value, null, "ivo@example.com")));
    }

    [Fact]
    public async Task EveryUsersTicketShowsWithItsSenderLatestFirst()
    {
        await _database.SaveTicketAsync(userId: _ana, message: "First", createdAtUtc: Monday);
        await _database.SaveTicketAsync(userId: _ivo, message: "Second", createdAtUtc: Monday.AddDays(1));

        List<InboxTicketListItemResponse> tickets = await ListAsync(null);

        tickets.Select(ticket => ticket.Preview).ShouldBe(["Second", "First"]);
        tickets[0].SenderName.ShouldBeNull();
        tickets[0].SenderEmail.ShouldBe("ivo@example.com");
        tickets[1].SenderName.ShouldBe("Ana");
        tickets.ShouldAllBe(ticket => ticket.WaitingForReply);
    }

    [Theory]
    [InlineData("answered")]
    [InlineData("Answered")]
    public async Task AStatusShowsOnlyItsTickets(string status)
    {
        await _database.SaveTicketAsync(userId: _ana, message: "Open one");
        await _database.SaveTicketAsync(userId: _ana, message: "Answered one", status: TicketStatus.Answered);

        (await ListAsync(status)).ShouldHaveSingleItem().Preview.ShouldBe("Answered one");
    }

    [Fact]
    public async Task HighTicketsComeFirst()
    {
        await _database.SaveTicketAsync(userId: _ana, message: "Older high", createdAtUtc: Monday);
        await _database.SaveTicketAsync(userId: _ana, message: "Newer normal", createdAtUtc: Monday.AddDays(1));
        Ticket high = (await _database.ListAllTicketsAsync()).Single(ticket => ticket.CreatedAtUtc == Monday);
        _database.DbContext.Attach(high);
        high.ChangePriority(TicketPriority.High);
        await _database.DbContext.SaveChangesAsync(FeedbackDatabase.Token);

        List<InboxTicketListItemResponse> tickets = await ListAsync(null);

        tickets.Select(ticket => ticket.Preview).ShouldBe(["Older high", "Newer normal"]);
        tickets[0].Priority.ShouldBe(TicketPriority.High);
    }

    [Fact]
    public async Task AUserShowsOnlyTheirTickets()
    {
        await _database.SaveTicketAsync(userId: _ana, message: "Ana's");
        await _database.SaveTicketAsync(userId: _ivo, message: "Ivo's");

        List<InboxTicketListItemResponse> tickets = (await _handler.HandleAsync(new ListInboxTicketsRequest(null, _ivo.Value), FeedbackDatabase.Token)).Value;

        tickets.ShouldHaveSingleItem().Preview.ShouldBe("Ivo's");
    }

    [Fact]
    public async Task ATicketMinimalistAnsweredLastIsNotWaiting()
    {
        Ticket ticket = await _database.SaveTicketAsync(userId: _ana, createdAtUtc: Monday);
        await _database.SaveMessageAsync(ticket, MessageAuthor.Admin, "Thanks", Monday.AddHours(1));

        (await ListAsync(null)).ShouldHaveSingleItem().WaitingForReply.ShouldBeFalse();
    }

    [Fact]
    public async Task AGoneSendersNameAndEmailAreEmpty()
    {
        await _database.SaveTicketAsync(userId: UserId.From(Guid.CreateVersion7()));

        InboxTicketListItemResponse ticket = (await ListAsync(null)).ShouldHaveSingleItem();

        ticket.SenderName.ShouldBeNull();
        ticket.SenderEmail.ShouldBeNull();
    }

    [Fact]
    public async Task AnUnknownStatusIsNotValid()
    {
        Result<List<InboxTicketListItemResponse>> result = await _handler.HandleAsync(new ListInboxTicketsRequest("waiting"), FeedbackDatabase.Token);

        result.Error.ShouldNotBeNull().Fields["status"].ShouldBe(["Status must be open, answered or closed."]);
    }

    public void Dispose()
    {
        _database.Dispose();
    }

    private async Task<List<InboxTicketListItemResponse>> ListAsync(string? status) =>
        (await _handler.HandleAsync(new ListInboxTicketsRequest(status), FeedbackDatabase.Token)).Value;
}
