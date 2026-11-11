using System.ComponentModel;

namespace Herculean.Feedback.Application.Tickets.GetScreenshot;

[Description("A screenshot on a message.")]
internal sealed record ScreenshotResponse(
    [property: Description("The screenshot as a Base64 JPEG.")] string Image);
