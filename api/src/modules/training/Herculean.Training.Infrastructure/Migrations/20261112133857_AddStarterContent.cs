using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Training.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStarterContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "starter_groups",
                schema: "training",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    normalized_name = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_starter_groups", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "starter_exercises",
                schema: "training",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    normalized_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    group_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_starter_exercises", x => x.id);
                    table.ForeignKey(
                        name: "fk_starter_exercises_starter_groups_group_id",
                        column: x => x.group_id,
                        principalSchema: "training",
                        principalTable: "starter_groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "starter_exercise_also_works",
                schema: "training",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    exercise_id = table.Column<Guid>(type: "uuid", nullable: false),
                    group_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_starter_exercise_also_works", x => x.id);
                    table.ForeignKey(
                        name: "fk_starter_exercise_also_works_starter_exercises_exercise_id",
                        column: x => x.exercise_id,
                        principalSchema: "training",
                        principalTable: "starter_exercises",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_starter_exercise_also_works_starter_groups_group_id",
                        column: x => x.group_id,
                        principalSchema: "training",
                        principalTable: "starter_groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_starter_exercise_also_works_exercise_id_group_id",
                schema: "training",
                table: "starter_exercise_also_works",
                columns: new[] { "exercise_id", "group_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_starter_exercise_also_works_group_id",
                schema: "training",
                table: "starter_exercise_also_works",
                column: "group_id");

            migrationBuilder.CreateIndex(
                name: "ix_starter_exercises_group_id",
                schema: "training",
                table: "starter_exercises",
                column: "group_id");

            migrationBuilder.CreateIndex(
                name: "ix_starter_exercises_normalized_name",
                schema: "training",
                table: "starter_exercises",
                column: "normalized_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_starter_groups_normalized_name",
                schema: "training",
                table: "starter_groups",
                column: "normalized_name",
                unique: true);

            // What new accounts started with until now, so they keep getting it. A millisecond apart keeps the list in this order.
            migrationBuilder.Sql("""
                INSERT INTO training.starter_groups (id, name, normalized_name, "order", created_at_utc, updated_at_utc)
                SELECT gen_random_uuid(), g.name, lower(g.name), g.ord - 1, now(), now()
                FROM unnest(ARRAY['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs']) WITH ORDINALITY AS g(name, ord);

                INSERT INTO training.starter_exercises (id, name, normalized_name, group_id, created_at_utc, updated_at_utc)
                SELECT gen_random_uuid(), e.name, lower(e.name), g.id, now() + e.ord * interval '1 millisecond', now() + e.ord * interval '1 millisecond'
                FROM (VALUES
                    ('Flat barbell bench press', 'Chest', 1),
                    ('Incline dumbbell bench press', 'Chest', 2),
                    ('Cable crossover', 'Chest', 3),
                    ('Smith machine incline bench press', 'Chest', 4),
                    ('Flat dumbbell bench press', 'Chest', 5),
                    ('Machine crossover', 'Chest', 6),
                    ('Pull-up', 'Back', 7),
                    ('Machine row', 'Back', 8),
                    ('Lat pulldown', 'Back', 9),
                    ('T-bar row', 'Back', 10),
                    ('Cable row', 'Back', 11),
                    ('Smith machine press', 'Shoulders', 12),
                    ('Dumbbell press', 'Shoulders', 13),
                    ('Lateral dumbbell raise', 'Shoulders', 14),
                    ('Machine press', 'Shoulders', 15),
                    ('Lateral machine raise', 'Shoulders', 16),
                    ('EZ bar curl', 'Biceps', 17),
                    ('Incline dumbbell curl', 'Biceps', 18),
                    ('Barbell curl', 'Biceps', 19),
                    ('Incline hammer curl', 'Biceps', 20),
                    ('EZ bar skullcrusher', 'Triceps', 21),
                    ('Rope pushdown', 'Triceps', 22),
                    ('Parallel bar dips', 'Triceps', 23),
                    ('Straight bar pushdown', 'Triceps', 24),
                    ('Barbell squat', 'Legs', 25),
                    ('Romanian deadlift', 'Legs', 26),
                    ('Leg extension', 'Legs', 27),
                    ('Smith machine calf raise', 'Legs', 28)
                ) AS e(name, group_name, ord)
                JOIN training.starter_groups g ON g.name = e.group_name;

                INSERT INTO training.starter_exercise_also_works (id, exercise_id, group_id, created_at_utc, updated_at_utc)
                SELECT gen_random_uuid(), e.id, g.id, now(), now()
                FROM (VALUES
                    ('Flat barbell bench press', 'Shoulders'),
                    ('Flat barbell bench press', 'Triceps'),
                    ('Incline dumbbell bench press', 'Triceps'),
                    ('Smith machine incline bench press', 'Shoulders'),
                    ('Smith machine incline bench press', 'Triceps'),
                    ('Flat dumbbell bench press', 'Triceps'),
                    ('Pull-up', 'Biceps'),
                    ('Parallel bar dips', 'Chest')
                ) AS a(exercise_name, group_name)
                JOIN training.starter_exercises e ON e.name = a.exercise_name
                JOIN training.starter_groups g ON g.name = a.group_name;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "starter_exercise_also_works",
                schema: "training");

            migrationBuilder.DropTable(
                name: "starter_exercises",
                schema: "training");

            migrationBuilder.DropTable(
                name: "starter_groups",
                schema: "training");
        }
    }
}
