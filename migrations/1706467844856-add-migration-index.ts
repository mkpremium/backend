import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMigrationIndex1706467844856 implements MigrationInterface {
    name = 'AddMigrationIndex1706467844856'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_afd7dc82b2b57fe0c218d646d6" ON "couchbase_document" ("documentType", "migratedAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_afd7dc82b2b57fe0c218d646d6"`);
    }

}
