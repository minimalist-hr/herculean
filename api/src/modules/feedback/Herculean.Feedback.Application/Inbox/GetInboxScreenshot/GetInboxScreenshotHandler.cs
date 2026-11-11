using Herculean.Feedback.Application.Tickets.GetScreenshot;
using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.Application.Inbox.GetInboxScreenshot;

internal sealed class GetInboxScreenshotHandler(IInboxReadRepository inboxReadRepository)
{
    public async Task<Result<ScreenshotResponse>> HandleAsync(Guid ticketId, Guid screenshotId, CancellationToken cancellationToken)
    {
        byte[]? image = await inboxReadRepository.GetScreenshotAsync(TicketId.From(ticketId), ScreenshotId.From(screenshotId), cancellationToken);

        return image is null ? TicketErrors.ScreenshotNotFound : new ScreenshotResponse(Convert.ToBase64String(image));
    }
}
