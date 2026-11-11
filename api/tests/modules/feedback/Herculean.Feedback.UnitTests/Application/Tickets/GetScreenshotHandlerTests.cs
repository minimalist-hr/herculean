using Herculean.Feedback.Application.Tickets.GetScreenshot;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Tickets;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.UnitTests.Application.Tickets;

public sealed class GetScreenshotHandlerTests : IDisposable
{
    private readonly FeedbackDatabase _database = new();
    private readonly GetScreenshotHandler _handler;

    public GetScreenshotHandlerTests()
    {
        _handler = new GetScreenshotHandler(new TicketReadRepository(_database.DbContext));
    }

    [Fact]
    public async Task TheScreenshotComesAsBase64()
    {
        Ticket ticket = await _database.SaveTicketAsync(screenshots: 1);

        Result<ScreenshotResponse> result = await HandleAsync(ticket.Id, ScreenshotOf(ticket));

        result.Value.Image.ShouldBe(Convert.ToBase64String(FeedbackDatabase.Jpeg));
    }

    [Fact]
    public async Task AScreenshotOfAnotherTicketIsNotFound()
    {
        Ticket ticket = await _database.SaveTicketAsync(screenshots: 1);
        Ticket other = await _database.SaveTicketAsync();

        (await HandleAsync(other.Id, ScreenshotOf(ticket))).Error.ShouldBe(TicketErrors.ScreenshotNotFound);
    }

    [Fact]
    public async Task AnotherUsersScreenshotIsNotFound()
    {
        Ticket ticket = await _database.SaveTicketAsync(userId: UserId.From(Guid.CreateVersion7()), screenshots: 1);

        (await HandleAsync(ticket.Id, ScreenshotOf(ticket))).Error.ShouldBe(TicketErrors.ScreenshotNotFound);
    }

    public void Dispose()
    {
        _database.Dispose();
    }

    private static ScreenshotId ScreenshotOf(Ticket ticket) => ticket.Messages[0].Screenshots[0].Id;

    private Task<Result<ScreenshotResponse>> HandleAsync(TicketId ticketId, ScreenshotId screenshotId) =>
        _handler.HandleAsync(ticketId.Value, screenshotId.Value, FeedbackDatabase.Token);
}
