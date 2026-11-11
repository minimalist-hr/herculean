namespace Herculean.Account.Infrastructure.Users;

/// <summary>When the deletion job last ran, and whether it worked, for its health check.</summary>
internal sealed class DeletionJobRuns
{
    public DateTimeOffset? LastRunUtc { get; private set; }

    public bool LastRunFailed { get; private set; }

    public void Ran(DateTimeOffset atUtc, bool failed)
    {
        LastRunUtc = atUtc;
        LastRunFailed = failed;
    }
}
