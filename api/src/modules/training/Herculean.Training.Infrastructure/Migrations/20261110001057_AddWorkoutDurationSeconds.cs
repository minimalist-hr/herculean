using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Training.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkoutDurationSeconds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "duration_seconds",
                schema: "training",
                table: "workouts",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql("UPDATE training.workouts SET duration_seconds = EXTRACT(EPOCH FROM finished_at_utc - started_at_utc)::int WHERE started_at_utc IS NOT NULL AND finished_at_utc IS NOT NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "duration_seconds",
                schema: "training",
                table: "workouts");
        }
    }
}
