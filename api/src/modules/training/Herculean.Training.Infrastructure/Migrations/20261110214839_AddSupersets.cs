using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Training.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSupersets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "superset_with_next",
                schema: "training",
                table: "workout_exercises",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "superset_with_next",
                schema: "training",
                table: "routine_exercises",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "superset_with_next",
                schema: "training",
                table: "workout_exercises");

            migrationBuilder.DropColumn(
                name: "superset_with_next",
                schema: "training",
                table: "routine_exercises");
        }
    }
}
