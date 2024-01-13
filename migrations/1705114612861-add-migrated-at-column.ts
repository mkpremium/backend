import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMigratedAtColumn1705114612861 implements MigrationInterface {
    name = 'AddMigratedAtColumn1705114612861'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "couchbase_document" ADD "migratedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "couchbase_document" DROP COLUMN "migratedAt"`);
    }

}
