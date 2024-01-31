import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCouchbaseDocumentFromCouchbaseColumn1706362630549 implements MigrationInterface {
  name = 'AddCouchbaseDocumentFromCouchbaseColumn1706362630549'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "couchbase_document"
      ADD "fromCouchbase" text NOT NULL DEFAULT 'current'`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "couchbase_document" DROP COLUMN "fromCouchbase"')
  }
}
