using FluentValidation;
using FluentValidation.Results;

using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Announcements;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Feedback.Application.Announcements.SaveAnnouncement;

internal sealed class SaveAnnouncementHandler(
    IValidator<SaveAnnouncementRequest> validator,
    IAnnouncementRepository announcementRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(SaveAnnouncementRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        // A new one replaces the last, so phones that closed it show this one.
        foreach (Announcement old in await announcementRepository.ListAsync(cancellationToken))
        {
            announcementRepository.Remove(old);
        }

        announcementRepository.Add(Announcement.Create(request.Title, request.Text));
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
