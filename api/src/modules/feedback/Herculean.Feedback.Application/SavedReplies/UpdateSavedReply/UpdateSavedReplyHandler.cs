using FluentValidation;
using FluentValidation.Results;

using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.SavedReplies;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Feedback.Application.SavedReplies.UpdateSavedReply;

internal sealed class UpdateSavedReplyHandler(
    IValidator<SaveSavedReplyRequest> validator,
    ISavedReplyRepository savedReplyRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, SaveSavedReplyRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        SavedReply? savedReply = await savedReplyRepository.GetAsync(SavedReplyId.From(id), cancellationToken);
        if (savedReply is null)
        {
            return SavedReplyErrors.NotFound;
        }

        if (SavedReplyTitles.IsTaken(await savedReplyRepository.ListTitlesAsync(cancellationToken), request.Title, savedReply.Id))
        {
            return SavedReplyErrors.TitleTaken;
        }

        savedReply.Change(request.Title, request.Text);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
