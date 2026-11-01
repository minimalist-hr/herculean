using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herculean.Training.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupNormalizedNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_groups_user_id_name",
                schema: "training",
                table: "groups");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                schema: "training",
                table: "groups",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "normalized_name",
                schema: "training",
                table: "groups",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("UPDATE training.groups SET normalized_name = lower(btrim(name));");

            migrationBuilder.CreateIndex(
                name: "ix_groups_user_id_normalized_name",
                schema: "training",
                table: "groups",
                columns: new[] { "user_id", "normalized_name" },
                unique: true,
                filter: "deleted_at_utc IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_groups_user_id_normalized_name",
                schema: "training",
                table: "groups");

            migrationBuilder.DropColumn(
                name: "normalized_name",
                schema: "training",
                table: "groups");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                schema: "training",
                table: "groups",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30);

            migrationBuilder.CreateIndex(
                name: "ix_groups_user_id_name",
                schema: "training",
                table: "groups",
                columns: new[] { "user_id", "name" },
                unique: true,
                filter: "deleted_at_utc IS NULL");
        }
    }
}
