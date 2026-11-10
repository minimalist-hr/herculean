using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Account.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRefreshTokenReplacedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "replaced_at_utc",
                schema: "account",
                table: "refresh_tokens",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "replaced_at_utc",
                schema: "account",
                table: "refresh_tokens");
        }
    }
}
