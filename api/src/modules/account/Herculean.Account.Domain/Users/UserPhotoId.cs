using Herculean.SharedKernel.Entities;

namespace Herculean.Account.Domain.Users;

internal readonly record struct UserPhotoId(Guid Value) : ITypedId<UserPhotoId>
{
    public static UserPhotoId New() => new(Guid.CreateVersion7());

    public static UserPhotoId From(Guid value) => new(value);
}
