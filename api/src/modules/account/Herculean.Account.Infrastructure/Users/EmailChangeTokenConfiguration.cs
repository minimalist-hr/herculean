using Herculean.Account.Application.Users.CreateUser;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Persistence;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Account.Infrastructure.Users;

internal sealed class EmailChangeTokenConfiguration : IEntityTypeConfiguration<EmailChangeToken>
{
    public void Configure(EntityTypeBuilder<EmailChangeToken> builder)
    {
        // No DbSet names this table, so it is named here.
        builder.ToTable("email_change_tokens");
        builder.Property(token => token.Id).HasConversion<TypedIdConverter<EmailChangeTokenId>>().ValueGeneratedNever();
        builder.Property(token => token.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.Property(token => token.NewEmail).HasMaxLength(CreateUserValidator.EmailMaxLength);
        builder.HasIndex(token => token.TokenHash).IsUnique();
    }
}
