using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Persistence;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Account.Infrastructure.Users;

internal sealed class PasswordResetTokenConfiguration : IEntityTypeConfiguration<PasswordResetToken>
{
    public void Configure(EntityTypeBuilder<PasswordResetToken> builder)
    {
        // No DbSet names this table, so it is named here.
        builder.ToTable("password_reset_tokens");
        builder.Property(token => token.Id).HasConversion<TypedIdConverter<PasswordResetTokenId>>().ValueGeneratedNever();
        builder.Property(token => token.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.HasIndex(token => token.TokenHash).IsUnique();
    }
}
