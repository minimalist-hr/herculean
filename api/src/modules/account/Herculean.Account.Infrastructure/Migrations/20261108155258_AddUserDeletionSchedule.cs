using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Account.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserDeletionSchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "deletion_scheduled_for_utc",
                schema: "account",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_deletion_scheduled_for_utc",
                schema: "account",
                table: "users",
                column: "deletion_scheduled_for_utc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_users_deletion_scheduled_for_utc",
                schema: "account",
                table: "users");

            migrationBuilder.DropColumn(
                name: "deletion_scheduled_for_utc",
                schema: "account",
                table: "users");
        }
    }
}
