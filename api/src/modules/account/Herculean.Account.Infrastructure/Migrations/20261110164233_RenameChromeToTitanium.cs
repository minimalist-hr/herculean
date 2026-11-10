using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Account.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameChromeToTitanium : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Chrome is called Titanium again.
            migrationBuilder.Sql("UPDATE account.users SET color = 'Titanium' WHERE color = 'Chrome';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // The colors added with it go back to Nitro, which the old code still knows.
            migrationBuilder.Sql("UPDATE account.users SET color = CASE WHEN color = 'Titanium' THEN 'Chrome' ELSE 'Nitro' END;");
        }
    }
}
