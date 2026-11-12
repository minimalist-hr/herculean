using Herculean.Feedback.Application.Inbox.UpdateTicketPriority;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Tickets;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.UnitTests.Application.Inbox;

public sealed class UpdateTicketPriorityHandlerTests : IDisposable
{
    private readonly FeedbackDatabase _database = new();
    private readonly UpdateTicketPriorityHandler _handler;

    public UpdateTicketPriorityHandlerTests()
    {
        _handler = new UpdateTicketPriorityHandler(new UpdateTicketPriorityValidator(), new TicketRepository(_database.DbContext), _database.DbContext);
    }

    [Fact]
    public async Task AnyUsersTicketGetsItsPriority()
    {
        Ticket ticket = await _database.SaveTicketAsync(userId: UserId.From(Guid.CreateVersion7()));

        Result result = await _handler.HandleAsync(ticket.Id.Value, new UpdateTicketPriorityRequest(TicketPriority.High), FeedbackDatabase.Token);

        result.IsSuccess.ShouldBeTrue();
        (await _database.ListAllTicketsAsync()).ShouldHaveSingleItem().Priority.ShouldBe(TicketPriority.High);
    }

    [Fact]
    public async Task AnUnknownPriorityIsNotValid()
    {
        Ticket ticket = await _database.SaveTicketAsync();

        Result result = await _handler.HandleAsync(ticket.Id.Value, new UpdateTicketPriorityRequest((TicketPriority)7), FeedbackDatabase.Token);

        result.Error.ShouldNotBeNull().Fields["priority"].ShouldBe(["Priority must be normal or high."]);
    }

    [Fact]
    public async Task AMissingTicketIsNotFound()
    {
        Result result = await _handler.HandleAsync(Guid.CreateVersion7(), new UpdateTicketPriorityRequest(TicketPriority.High), FeedbackDatabase.Token);

        result.Error.ShouldBe(TicketErrors.NotFound);
    }

    public void Dispose()
    {
        _database.Dispose();
    }
}
