using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Training.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkoutPlannedSets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "planned_sets",
                schema: "training",
                table: "workouts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Earlier workouts only have the exercises they kept, which is the closest to what was planned.
            migrationBuilder.Sql("""
                UPDATE training.workouts AS w
                SET planned_sets = COALESCE((SELECT SUM(e.target_sets) FROM training.workout_exercises AS e WHERE e.workout_id = w.id), 0);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "planned_sets",
                schema: "training",
                table: "workouts");
        }
    }
}
