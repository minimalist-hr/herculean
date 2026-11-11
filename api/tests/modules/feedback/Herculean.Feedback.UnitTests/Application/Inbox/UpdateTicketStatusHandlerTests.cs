using Herculean.Feedback.Application.Inbox.UpdateTicketStatus;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Tickets;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.UnitTests.Application.Inbox;

public sealed class UpdateTicketStatusHandlerTests : IDisposable
{
    private readonly FeedbackDatabase _database = new();
    private readonly UpdateTicketStatusHandler _handler;

    public UpdateTicketStatusHandlerTests()
    {
        _handler = new UpdateTicketStatusHandler(new UpdateTicketStatusValidator(), new TicketRepository(_database.DbContext), _database.DbContext);
    }

    // The statuses are internal, so the cases pass their names.
    [Theory]
    [InlineData("Answered", "Closed")]
    [InlineData("Closed", "Open")]
    [InlineData("Closed", "Closed")]
    public async Task AnyUsersTicketIsClosedOrReopened(string fromName, string toName)
    {
        TicketStatus from = Enum.Parse<TicketStatus>(fromName);
        TicketStatus to = Enum.Parse<TicketStatus>(toName);
        Ticket ticket = await _database.SaveTicketAsync(userId: UserId.From(Guid.CreateVersion7()), status: from);

        Result result = await _handler.HandleAsync(ticket.Id.Value, new UpdateTicketStatusRequest(to), FeedbackDatabase.Token);

        result.IsSuccess.ShouldBeTrue();
        (await _database.ListAllTicketsAsync()).ShouldHaveSingleItem().Status.ShouldBe(to);
    }

    [Fact]
    public async Task AnsweredComesOnlyFromAReply()
    {
        Ticket ticket = await _database.SaveTicketAsync();

        Result result = await _handler.HandleAsync(ticket.Id.Value, new UpdateTicketStatusRequest(TicketStatus.Answered), FeedbackDatabase.Token);

        result.Error.ShouldNotBeNull().Fields["status"].ShouldBe(["Status must be open or closed."]);
    }

    [Fact]
    public async Task AMissingTicketIsNotFound()
    {
        Result result = await _handler.HandleAsync(Guid.CreateVersion7(), new UpdateTicketStatusRequest(TicketStatus.Closed), FeedbackDatabase.Token);

        result.Error.ShouldBe(TicketErrors.NotFound);
    }

    public void Dispose()
    {
        _database.Dispose();
    }
}
