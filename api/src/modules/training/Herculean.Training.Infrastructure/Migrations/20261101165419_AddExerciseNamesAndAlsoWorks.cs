using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Training.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExerciseNamesAndAlsoWorks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_exercises_user_id",
                schema: "training",
                table: "exercises");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                schema: "training",
                table: "exercises",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "normalized_name",
                schema: "training",
                table: "exercises",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            // Exercises saved before this column get their name too, before the unique index needs it.
            migrationBuilder.Sql("UPDATE training.exercises SET normalized_name = lower(trim(name));");

            migrationBuilder.CreateTable(
                name: "exercise_also_works",
                schema: "training",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    exercise_id = table.Column<Guid>(type: "uuid", nullable: false),
                    group_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_exercise_also_works", x => x.id);
                    table.ForeignKey(
                        name: "fk_exercise_also_works_exercises_exercise_id",
                        column: x => x.exercise_id,
                        principalSchema: "training",
                        principalTable: "exercises",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_exercise_also_works_groups_group_id",
                        column: x => x.group_id,
                        principalSchema: "training",
                        principalTable: "groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_exercises_user_id_normalized_name",
                schema: "training",
                table: "exercises",
                columns: new[] { "user_id", "normalized_name" },
                unique: true,
                filter: "deleted_at_utc IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_exercise_also_works_exercise_id_group_id",
                schema: "training",
                table: "exercise_also_works",
                columns: new[] { "exercise_id", "group_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_exercise_also_works_group_id",
                schema: "training",
                table: "exercise_also_works",
                column: "group_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "exercise_also_works",
                schema: "training");

            migrationBuilder.DropIndex(
                name: "ix_exercises_user_id_normalized_name",
                schema: "training",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "normalized_name",
                schema: "training",
                table: "exercises");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                schema: "training",
                table: "exercises",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.CreateIndex(
                name: "ix_exercises_user_id",
                schema: "training",
                table: "exercises",
                column: "user_id");
        }
    }
}
