using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Account.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameColors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Racing blue became Nitro and Titanium became Chrome.
            migrationBuilder.Sql("""
                UPDATE account.users
                SET color = CASE color WHEN 'RacingBlue' THEN 'Nitro' WHEN 'Titanium' THEN 'Chrome' ELSE color END;
                ALTER TABLE account.users ALTER COLUMN color SET DEFAULT 'Nitro';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE account.users
                SET color = CASE color WHEN 'Nitro' THEN 'RacingBlue' WHEN 'Chrome' THEN 'Titanium' ELSE color END;
                ALTER TABLE account.users ALTER COLUMN color SET DEFAULT 'RacingBlue';
                """);
        }
    }
}
