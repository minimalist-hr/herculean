using Herculean.SharedKernel.Entities;

namespace Herculean.Account.Domain.Users;

internal readonly record struct PasswordResetTokenId(Guid Value) : ITypedId<PasswordResetTokenId>
{
    public static PasswordResetTokenId New() => new(Guid.CreateVersion7());

    public static PasswordResetTokenId From(Guid value) => new(value);
}
