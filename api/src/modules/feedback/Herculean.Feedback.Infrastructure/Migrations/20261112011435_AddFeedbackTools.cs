using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Feedback.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFeedbackTools : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "priority",
                schema: "feedback",
                table: "tickets",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                // Every ticket so far is normal.
                defaultValue: "Normal");

            migrationBuilder.CreateTable(
                name: "feedback_blocks",
                schema: "feedback",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_feedback_blocks", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "saved_replies",
                schema: "feedback",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_saved_replies", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ticket_notes",
                schema: "feedback",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ticket_id = table.Column<Guid>(type: "uuid", nullable: false),
                    text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ticket_notes", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_feedback_blocks_user_id",
                schema: "feedback",
                table: "feedback_blocks",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_ticket_notes_ticket_id",
                schema: "feedback",
                table: "ticket_notes",
                column: "ticket_id");

            migrationBuilder.CreateIndex(
                name: "ix_ticket_notes_user_id",
                schema: "feedback",
                table: "ticket_notes",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "feedback_blocks",
                schema: "feedback");

            migrationBuilder.DropTable(
                name: "saved_replies",
                schema: "feedback");

            migrationBuilder.DropTable(
                name: "ticket_notes",
                schema: "feedback");

            migrationBuilder.DropColumn(
                name: "priority",
                schema: "feedback",
                table: "tickets");
        }
    }
}
