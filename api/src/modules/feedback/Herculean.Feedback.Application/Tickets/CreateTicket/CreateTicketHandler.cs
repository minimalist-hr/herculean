using FluentValidation;
using FluentValidation.Results;

using Herculean.Feedback.Application.Auth;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Blocks;
using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Feedback.Application.Tickets.CreateTicket;

internal sealed class CreateTicketHandler(
    IValidator<CreateTicketRequest> validator,
    CurrentUser currentUser,
    ITicketRepository ticketRepository,
    IFeedbackBlockRepository blockRepository,
    TimeProvider timeProvider,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<TicketCreatedResponse>> HandleAsync(CreateTicketRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        if (await blockRepository.IsCurrentUserBlockedAsync(cancellationToken))
        {
            return FeedbackBlockErrors.Blocked;
        }

        DateTimeOffset dayAgo = timeProvider.GetUtcNow().AddDays(-1);
        if (await ticketRepository.CountCreatedSinceAsync(dayAgo, cancellationToken) >= Ticket.MaxPerDay)
        {
            return TicketErrors.LimitReached;
        }

        Ticket ticket = Ticket.Create(currentUser.UserId, request.Type, request.Message, request.ToImages(), new DeviceInfo(request.AppVersion, request.Phone, request.Os));
        ticketRepository.Add(ticket);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new TicketCreatedResponse(ticket.Id.Value);
    }
}
