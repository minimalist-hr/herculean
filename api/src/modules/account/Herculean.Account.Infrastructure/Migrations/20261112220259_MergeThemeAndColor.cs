using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Account.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MergeThemeAndColor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Each light or dark choice and color becomes the theme closest to it.
            migrationBuilder.Sql("""
                UPDATE account.users SET theme = CASE
                    WHEN theme = 'Light' AND color = 'Titanium' THEN 'Paper'
                    WHEN theme = 'Light' THEN 'Fjord'
                    WHEN color = 'Titanium' THEN 'Mono'
                    WHEN color IN ('Flux', 'Plasma') THEN 'Smoke'
                    ELSE 'Default'
                END;
                """);

            migrationBuilder.DropColumn(
                name: "color",
                schema: "account",
                table: "users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "color",
                schema: "account",
                table: "users",
                type: "text",
                nullable: false,
                defaultValue: "Nitro");

            // Back to the values the old code knows: light themes are Light, Mono and Paper are Titanium.
            migrationBuilder.Sql("""
                UPDATE account.users SET
                    color = CASE WHEN theme IN ('Mono', 'Paper') THEN 'Titanium' WHEN theme = 'Smoke' THEN 'Flux' ELSE 'Nitro' END,
                    theme = CASE WHEN theme IN ('Paper', 'Fjord', 'Latte', 'Frost') THEN 'Light' ELSE 'Dark' END;
                """);
        }
    }
}
