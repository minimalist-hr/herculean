using Herculean.SharedKernel.Entities;

namespace Herculean.Account.Domain.Users;

internal readonly record struct EmailChangeTokenId(Guid Value) : ITypedId<EmailChangeTokenId>
{
    public static EmailChangeTokenId New() => new(Guid.CreateVersion7());

    public static EmailChangeTokenId From(Guid value) => new(value);
}
