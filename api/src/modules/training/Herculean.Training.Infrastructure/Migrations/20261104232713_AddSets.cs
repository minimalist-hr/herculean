using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Training.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "finished_at_utc",
                schema: "training",
                table: "workouts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "started_at_utc",
                schema: "training",
                table: "workouts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "sets",
                schema: "training",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    workout_exercise_id = table.Column<Guid>(type: "uuid", nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false),
                    weight_kg = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false),
                    reps = table.Column<int>(type: "integer", nullable: false),
                    @checked = table.Column<bool>(name: "checked", type: "boolean", nullable: false),
                    weight_changed = table.Column<bool>(type: "boolean", nullable: false),
                    reps_changed = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sets", x => x.id);
                    table.ForeignKey(
                        name: "fk_sets_workout_exercises_workout_exercise_id",
                        column: x => x.workout_exercise_id,
                        principalSchema: "training",
                        principalTable: "workout_exercises",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "ix_workouts_user_id",
                schema: "training",
                table: "workouts",
                column: "user_id",
                unique: true,
                filter: "status = 'InProgress' AND deleted_at_utc IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_sets_workout_exercise_id",
                schema: "training",
                table: "sets",
                column: "workout_exercise_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "sets",
                schema: "training");

            migrationBuilder.DropIndex(
                name: "ix_workouts_user_id",
                schema: "training",
                table: "workouts");

            migrationBuilder.DropColumn(
                name: "finished_at_utc",
                schema: "training",
                table: "workouts");

            migrationBuilder.DropColumn(
                name: "started_at_utc",
                schema: "training",
                table: "workouts");
        }
    }
}
