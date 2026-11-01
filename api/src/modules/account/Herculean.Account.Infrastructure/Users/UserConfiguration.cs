using Herculean.Account.Application.Users.CreateUser;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Persistence;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Account.Infrastructure.Users;

internal sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.Property(user => user.Id).HasConversion<TypedIdConverter<UserId>>().ValueGeneratedNever();
        builder.Property(user => user.Email).HasMaxLength(CreateUserValidator.EmailMaxLength);
        builder.HasIndex(user => user.Email).IsUnique();
        builder.Property(user => user.Name).HasMaxLength(User.NameMaxLength);

        // Stored by name, so reordering the enum never changes saved data.
        builder.Property(user => user.Units).HasConversion<string>();

        builder.HasMany(user => user.RefreshTokens)
            .WithOne()
            .HasForeignKey(token => token.UserId)
            .OnDelete(DeleteBehavior.ClientCascade);
    }
}
