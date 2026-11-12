using System.ComponentModel;

namespace Herculean.Feedback.Application.Announcements;

[Description("Minimalist's announcement on Home, if there is one.")]
internal sealed record CurrentAnnouncementResponse(
    [property: Description("The announcement, or null when there is none.")] AnnouncementResponse? Announcement);

[Description("What Minimalist tells everyone on Home.")]
internal sealed record AnnouncementResponse(
    [property: Description("Its ID. A new one comes with every save, so a phone that closed the last shows it again.")] Guid Id,
    [property: Description("The title.")] string Title,
    [property: Description("The text.")] string Text,
    [property: Description("When it was saved.")] DateTimeOffset PublishedAtUtc);
