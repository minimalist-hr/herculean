using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Training.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRoutinesAndWeekPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "routines",
                schema: "training",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    normalized_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    deleted_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_routines", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "routine_exercises",
                schema: "training",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    routine_id = table.Column<Guid>(type: "uuid", nullable: false),
                    exercise_id = table.Column<Guid>(type: "uuid", nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false),
                    target_sets = table.Column<int>(type: "integer", nullable: false),
                    target_reps_from = table.Column<int>(type: "integer", nullable: false),
                    target_reps_to = table.Column<int>(type: "integer", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_routine_exercises", x => x.id);
                    table.ForeignKey(
                        name: "fk_routine_exercises_exercises_exercise_id",
                        column: x => x.exercise_id,
                        principalSchema: "training",
                        principalTable: "exercises",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_routine_exercises_routines_routine_id",
                        column: x => x.routine_id,
                        principalSchema: "training",
                        principalTable: "routines",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "week_plan_days",
                schema: "training",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    weekday = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: false),
                    routine_id = table.Column<Guid>(type: "uuid", nullable: true),
                    effective_from = table.Column<DateOnly>(type: "date", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_week_plan_days", x => x.id);
                    table.ForeignKey(
                        name: "fk_week_plan_days_routines_routine_id",
                        column: x => x.routine_id,
                        principalSchema: "training",
                        principalTable: "routines",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_routine_exercises_exercise_id",
                schema: "training",
                table: "routine_exercises",
                column: "exercise_id");

            migrationBuilder.CreateIndex(
                name: "ix_routine_exercises_routine_id_exercise_id",
                schema: "training",
                table: "routine_exercises",
                columns: new[] { "routine_id", "exercise_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_routines_user_id_normalized_name",
                schema: "training",
                table: "routines",
                columns: new[] { "user_id", "normalized_name" },
                unique: true,
                filter: "deleted_at_utc IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_week_plan_days_routine_id",
                schema: "training",
                table: "week_plan_days",
                column: "routine_id");

            migrationBuilder.CreateIndex(
                name: "ix_week_plan_days_user_id_weekday_effective_from",
                schema: "training",
                table: "week_plan_days",
                columns: new[] { "user_id", "weekday", "effective_from" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "routine_exercises",
                schema: "training");

            migrationBuilder.DropTable(
                name: "week_plan_days",
                schema: "training");

            migrationBuilder.DropTable(
                name: "routines",
                schema: "training");
        }
    }
}
