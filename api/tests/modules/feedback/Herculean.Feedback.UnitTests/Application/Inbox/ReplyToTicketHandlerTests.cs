using Herculean.Feedback.Application.Inbox.ReplyToTicket;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Tickets;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.UnitTests.Application.Inbox;

public sealed class ReplyToTicketHandlerTests : IDisposable
{
    private static readonly string Jpeg = Convert.ToBase64String(FeedbackDatabase.Jpeg);
    private readonly FeedbackDatabase _database = new();
    private readonly ReplyToTicketHandler _handler;

    public ReplyToTicketHandlerTests()
    {
        _handler = new ReplyToTicketHandler(new ReplyToTicketValidator(), new TicketRepository(_database.DbContext), _database.DbContext);
    }

    [Fact]
    public async Task AReplyAnswersAnyUsersTicketAndIsUnreadForThem()
    {
        Ticket ticket = await _database.SaveTicketAsync(userId: UserId.From(Guid.CreateVersion7()));

        Result result = await HandleAsync(ticket, new ReplyToTicketRequest(" Fixed in 1.0.1. ", [Jpeg]));

        result.IsSuccess.ShouldBeTrue();
        Ticket saved = (await _database.ListAllTicketsAsync()).ShouldHaveSingleItem();
        saved.Status.ShouldBe(TicketStatus.Answered);
        saved.HasUnreadReply.ShouldBeTrue();
        TicketMessage reply = (await _database.ListMessagesAsync(ticket)).Single(message => message.Author == MessageAuthor.Admin);
        reply.Text.ShouldBe("Fixed in 1.0.1.");
        reply.UserId.ShouldBe(ticket.UserId);
        reply.Screenshots.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task AClosedTicketTakesNoReplies()
    {
        Ticket ticket = await _database.SaveTicketAsync(status: TicketStatus.Closed);

        (await HandleAsync(ticket, new ReplyToTicketRequest("Hello", null))).Error.ShouldBe(TicketErrors.Closed);
    }

    [Fact]
    public async Task AnEmptyReplyIsNotValid()
    {
        Ticket ticket = await _database.SaveTicketAsync();

        (await HandleAsync(ticket, new ReplyToTicketRequest("", null))).Error.ShouldNotBeNull().Fields.ShouldContainKey("message");
    }

    [Fact]
    public async Task AMissingTicketIsNotFound()
    {
        Result result = await _handler.HandleAsync(Guid.CreateVersion7(), new ReplyToTicketRequest("Hello", null), FeedbackDatabase.Token);

        result.Error.ShouldBe(TicketErrors.NotFound);
    }

    public void Dispose()
    {
        _database.Dispose();
    }

    private Task<Result> HandleAsync(Ticket ticket, ReplyToTicketRequest request) =>
        _handler.HandleAsync(ticket.Id.Value, request, FeedbackDatabase.Token);
}
