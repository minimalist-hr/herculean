using System.ComponentModel;

namespace Herculean.Feedback.Application.Announcements.SaveAnnouncement;

[Description("The announcement to show on Home.")]
internal sealed record SaveAnnouncementRequest(
    [property: Description("1 to 60 characters, trimmed.")] string Title,
    [property: Description("1 to 300 characters, trimmed.")] string Text);
