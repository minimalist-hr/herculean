using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Account.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailChangeTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "email_change_tokens",
                schema: "account",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    new_email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    token_hash = table.Column<string>(type: "text", nullable: false),
                    expires_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_email_change_tokens", x => x.id);
                    table.ForeignKey(
                        name: "fk_email_change_tokens_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "account",
                        principalTable: "users",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "ix_email_change_tokens_token_hash",
                schema: "account",
                table: "email_change_tokens",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_email_change_tokens_user_id",
                schema: "account",
                table: "email_change_tokens",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "email_change_tokens",
                schema: "account");
        }
    }
}
