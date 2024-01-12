import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOwnerNote1704840795665 implements MigrationInterface {
    name = 'AddOwnerNote1704840795665'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "owner" ADD "note" text`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "owner" DROP COLUMN "note"`)
    }

}
