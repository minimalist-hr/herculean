using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.Application.Tickets.GetScreenshot;

internal sealed class GetScreenshotHandler(ITicketReadRepository ticketReadRepository)
{
    public async Task<Result<ScreenshotResponse>> HandleAsync(Guid ticketId, Guid screenshotId, CancellationToken cancellationToken)
    {
        byte[]? image = await ticketReadRepository.GetScreenshotAsync(TicketId.From(ticketId), ScreenshotId.From(screenshotId), cancellationToken);

        return image is null ? TicketErrors.ScreenshotNotFound : new ScreenshotResponse(Convert.ToBase64String(image));
    }
}
