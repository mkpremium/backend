import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMigratedAtColumn1705150409170 implements MigrationInterface {
  name = 'AddMigratedAtColumn1705150409170'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "couchbase_document" ADD "migratedAt" TIMESTAMP')
    await queryRunner.query('CREATE INDEX "IDX_0089c446ba0b9d023fdcf3a49f" ON "couchbase_document" ("migratedAt") ')
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "public"."IDX_0089c446ba0b9d023fdcf3a49f"')
    await queryRunner.query('ALTER TABLE "couchbase_document" DROP COLUMN "migratedAt"')
  }
}
