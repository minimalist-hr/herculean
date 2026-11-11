using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Training.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLengthenedPartials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "lengthened_partials",
                schema: "training",
                table: "workout_exercises",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "partials_done",
                schema: "training",
                table: "sets",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "lengthened_partials",
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
                name: "lengthened_partials",
                schema: "training",
                table: "workout_exercises");

            migrationBuilder.DropColumn(
                name: "partials_done",
                schema: "training",
                table: "sets");

            migrationBuilder.DropColumn(
                name: "lengthened_partials",
                schema: "training",
                table: "routine_exercises");
        }
    }
}
