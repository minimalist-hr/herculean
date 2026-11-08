namespace Herculean.Account.Application.EmailChanges;

internal static class EmailChangeRoutes
{
    public const string Tag = "Email changes";

    public const string EmailChanges = "/api/v1/email-changes";

    public const string Pending = EmailChanges + "/pending";

    public const string Resend = EmailChanges + "/resend";

    public const string Confirm = EmailChanges + "/confirm";

    public const string ConfirmLink = "/links/confirm-email";

    public const string RequestRateLimit = "email-change";

    public const string ResendRateLimit = "email-change-resend";

    public const string ConfirmRateLimit = "email-change-confirm";
}
