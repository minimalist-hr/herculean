using FluentValidation;
using FluentValidation.Results;

using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.SavedReplies;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Feedback.Application.SavedReplies.CreateSavedReply;

internal sealed class CreateSavedReplyHandler(
    IValidator<SaveSavedReplyRequest> validator,
    ISavedReplyRepository savedReplyRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<SavedReplyCreatedResponse>> HandleAsync(SaveSavedReplyRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        List<(SavedReplyId Id, string Title)> titles = await savedReplyRepository.ListTitlesAsync(cancellationToken);
        if (titles.Count >= SavedReply.MaxCount)
        {
            return SavedReplyErrors.LimitReached;
        }

        if (SavedReplyTitles.IsTaken(titles, request.Title))
        {
            return SavedReplyErrors.TitleTaken;
        }

        SavedReply savedReply = SavedReply.Create(request.Title, request.Text);
        savedReplyRepository.Add(savedReply);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new SavedReplyCreatedResponse(savedReply.Id.Value);
    }
}
