using System.Threading.Channels;

using Herculean.Account.Application.PasswordResets;

namespace Herculean.Account.Infrastructure.PasswordResets;

/// <summary>Kept in memory: a restart loses what is waiting, and the user can send the link again.</summary>
internal sealed class PasswordResetQueue : IPasswordResetQueue
{
    private const int Capacity = 1000;

    // A full queue drops the new request. The rate limit makes this unlikely, and the user can send the link again.
    private readonly Channel<string> _emails = Channel.CreateBounded<string>(
        new BoundedChannelOptions(Capacity) { FullMode = BoundedChannelFullMode.DropWrite, SingleReader = true });

    public void Enqueue(string email)
    {
        _emails.Writer.TryWrite(email);
    }

    internal IAsyncEnumerable<string> ReadAllAsync(CancellationToken cancellationToken) =>
        _emails.Reader.ReadAllAsync(cancellationToken);
}
