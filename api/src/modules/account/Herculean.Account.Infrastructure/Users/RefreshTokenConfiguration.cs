using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Persistence;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Account.Infrastructure.Users;

internal sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        // No DbSet names this table, so it is named here.
        builder.ToTable("refresh_tokens");
        builder.Property(token => token.Id).HasConversion<TypedIdConverter<RefreshTokenId>>().ValueGeneratedNever();
        builder.Property(token => token.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.HasIndex(token => token.TokenHash).IsUnique();
    }
}
