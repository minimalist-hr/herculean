using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Account.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserLastActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "last_active_utc",
                schema: "account",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            // Users who signed in before this: the newest refresh token was issued 30 days before it expires.
            // Without one, they were last active when they signed up.
            migrationBuilder.Sql("""
                UPDATE account.users AS u
                SET last_active_utc = COALESCE(
                    (SELECT MAX(t.expires_at_utc) - INTERVAL '30 days' FROM account.refresh_tokens AS t WHERE t.user_id = u.id),
                    u.created_at_utc);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "last_active_utc",
                schema: "account",
                table: "users");
        }
    }
}
