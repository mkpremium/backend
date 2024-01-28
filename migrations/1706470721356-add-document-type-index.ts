import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDocumentTypeIndex1706470721356 implements MigrationInterface {
  name = 'AddDocumentTypeIndex1706470721356'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_119180300acecf8d70800d6c67" ON "couchbase_document" ("documentType") `)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_119180300acecf8d70800d6c67"`)
  }

}
