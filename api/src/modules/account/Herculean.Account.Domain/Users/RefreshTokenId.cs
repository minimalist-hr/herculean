using Herculean.SharedKernel.Entities;

namespace Herculean.Account.Domain.Users;

internal readonly record struct RefreshTokenId(Guid Value) : ITypedId<RefreshTokenId>
{
    public static RefreshTokenId New() => new(Guid.CreateVersion7());

    public static RefreshTokenId From(Guid value) => new(value);
}
