namespace Herculean.Feedback.Application.Blocks;

internal static class BlockRoutes
{
    public const string Tag = "Feedback blocks";

    public const string User = "/api/v1/admin/users/{id:guid}/feedback-block";

    public const string Own = "/api/v1/feedback/block";
}
