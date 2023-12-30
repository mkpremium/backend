import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWorksheetQueueSource1703949733979 implements MigrationInterface {
    name = 'AddWorksheetQueueSource1703949733979'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "worksheet_queue" ADD "source" jsonb NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "worksheet_queue" DROP COLUMN "source"`);
    }

}
