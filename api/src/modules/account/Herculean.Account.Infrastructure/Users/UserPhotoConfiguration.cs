using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Persistence;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Account.Infrastructure.Users;

internal sealed class UserPhotoConfiguration : IEntityTypeConfiguration<UserPhoto>
{
    public void Configure(EntityTypeBuilder<UserPhoto> builder)
    {
        // No DbSet names this table, so it is named here.
        builder.ToTable("user_photos");
        builder.Property(photo => photo.Id).HasConversion<TypedIdConverter<UserPhotoId>>().ValueGeneratedNever();
        builder.Property(photo => photo.UserId).HasConversion<TypedIdConverter<UserId>>();
    }
}
