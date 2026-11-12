using FluentValidation;

using Herculean.Feedback.Domain.SavedReplies;

namespace Herculean.Feedback.Application.SavedReplies;

internal sealed class SaveSavedReplyValidator : AbstractValidator<SaveSavedReplyRequest>
{
    public SaveSavedReplyValidator()
    {
        RuleFor(request => request.Title)
            .Must(title => !string.IsNullOrWhiteSpace(title))
            .WithMessage("Enter a title.")
            .Must(title => title is null || title.Trim().Length <= SavedReply.TitleMaxLength)
            .WithMessage($"A title has at most {SavedReply.TitleMaxLength} characters.");

        RuleFor(request => request.Text)
            .Must(text => !string.IsNullOrWhiteSpace(text))
            .WithMessage("Write the reply.")
            .Must(text => text is null || text.Trim().Length <= SavedReply.TextMaxLength)
            .WithMessage($"A reply has at most {SavedReply.TextMaxLength:N0} characters.");
    }
}
