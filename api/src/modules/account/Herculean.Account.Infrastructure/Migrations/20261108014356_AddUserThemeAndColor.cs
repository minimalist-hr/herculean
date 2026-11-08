using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Account.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserThemeAndColor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "color",
                schema: "account",
                table: "users",
                type: "text",
                nullable: false,
                defaultValue: "RacingBlue");

            migrationBuilder.AddColumn<string>(
                name: "theme",
                schema: "account",
                table: "users",
                type: "text",
                nullable: false,
                defaultValue: "MatchPhone");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "color",
                schema: "account",
                table: "users");

            migrationBuilder.DropColumn(
                name: "theme",
                schema: "account",
                table: "users");
        }
    }
}
