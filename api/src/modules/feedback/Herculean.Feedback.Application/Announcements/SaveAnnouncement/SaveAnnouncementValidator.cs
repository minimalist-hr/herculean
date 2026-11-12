using FluentValidation;

using Herculean.Feedback.Domain.Announcements;

namespace Herculean.Feedback.Application.Announcements.SaveAnnouncement;

internal sealed class SaveAnnouncementValidator : AbstractValidator<SaveAnnouncementRequest>
{
    public SaveAnnouncementValidator()
    {
        RuleFor(request => request.Title)
            .Must(title => !string.IsNullOrWhiteSpace(title))
            .WithMessage("Enter a title.")
            .Must(title => title is null || title.Trim().Length <= Announcement.TitleMaxLength)
            .WithMessage($"A title has at most {Announcement.TitleMaxLength} characters.");

        RuleFor(request => request.Text)
            .Must(text => !string.IsNullOrWhiteSpace(text))
            .WithMessage("Write the announcement.")
            .Must(text => text is null || text.Trim().Length <= Announcement.TextMaxLength)
            .WithMessage($"An announcement has at most {Announcement.TextMaxLength} characters.");
    }
}
