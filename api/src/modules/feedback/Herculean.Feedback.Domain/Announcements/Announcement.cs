using Herculean.SharedKernel.Entities;

namespace Herculean.Feedback.Domain.Announcements;

/// <summary>
/// What Minimalist tells everyone on Home. There is at most one; saving replaces it with a new one,
/// so a phone that closed the last shows it again.
/// </summary>
[AdminData]
internal sealed class Announcement : Entity<AnnouncementId>
{
    internal const int TitleMaxLength = 60;

    internal const int TextMaxLength = 300;

    private Announcement(AnnouncementId id, string title, string text) : base(id)
    {
        Title = title;
        Text = text;
    }

    public string Title { get; private set; }

    public string Text { get; private set; }

    public static Announcement Create(string title, string text) => new(AnnouncementId.New(), title.Trim(), text.Trim());
}
