using Herculean.Feedback.Application.Tickets.AddTicketMessage;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Tickets;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.UnitTests.Application.Tickets;

public sealed class AddTicketMessageHandlerTests : IDisposable
{
    private static readonly string Jpeg = Convert.ToBase64String(FeedbackDatabase.Jpeg);
    private readonly FeedbackDatabase _database = new();
    private readonly AddTicketMessageHandler _handler;

    public AddTicketMessageHandlerTests()
    {
        _handler = new AddTicketMessageHandler(new AddTicketMessageValidator(), new TicketRepository(_database.DbContext), _database.DbContext);
    }

    [Fact]
    public async Task AReplyIsSavedAndTheTicketIsOpenAgain()
    {
        Ticket ticket = await _database.SaveTicketAsync(status: TicketStatus.Answered);

        Result result = await HandleAsync(ticket, new AddTicketMessageRequest(" On Android 15. ", [Jpeg]));

        result.IsSuccess.ShouldBeTrue();
        (await _database.ListAllTicketsAsync()).ShouldHaveSingleItem().Status.ShouldBe(TicketStatus.Open);
        List<TicketMessage> messages = await _database.ListMessagesAsync(ticket);
        messages.Count.ShouldBe(2);
        TicketMessage reply = messages.Single(message => message.Text == "On Android 15.");
        reply.Author.ShouldBe(MessageAuthor.User);
        reply.Screenshots.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task AClosedTicketTakesNoReplies()
    {
        Ticket ticket = await _database.SaveTicketAsync(status: TicketStatus.Closed);

        Result result = await HandleAsync(ticket, new AddTicketMessageRequest("Hello?", null));

        result.Error.ShouldBe(TicketErrors.Closed);
        (await _database.ListMessagesAsync(ticket)).ShouldHaveSingleItem();
    }

    [Fact]
    public async Task AnEmptyReplyIsNotValid()
    {
        Ticket ticket = await _database.SaveTicketAsync();

        Result result = await HandleAsync(ticket, new AddTicketMessageRequest(" ", null));

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("message");
    }

    [Fact]
    public async Task AnotherUsersTicketIsNotFound()
    {
        Ticket ticket = await _database.SaveTicketAsync(userId: UserId.From(Guid.CreateVersion7()));

        (await HandleAsync(ticket, new AddTicketMessageRequest("Hello", null))).Error.ShouldBe(TicketErrors.NotFound);
    }

    public void Dispose()
    {
        _database.Dispose();
    }

    private Task<Result> HandleAsync(Ticket ticket, AddTicketMessageRequest request) =>
        _handler.HandleAsync(ticket.Id.Value, request, FeedbackDatabase.Token);
}
