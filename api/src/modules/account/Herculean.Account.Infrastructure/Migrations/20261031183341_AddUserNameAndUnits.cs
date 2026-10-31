using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Account.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserNameAndUnits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "name",
                schema: "account",
                table: "users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "units",
                schema: "account",
                table: "users",
                type: "text",
                nullable: false,
                // Users from before setup existed start with the same units as a new user.
                defaultValue: "Metric");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "name",
                schema: "account",
                table: "users");

            migrationBuilder.DropColumn(
                name: "units",
                schema: "account",
                table: "users");
        }
    }
}
