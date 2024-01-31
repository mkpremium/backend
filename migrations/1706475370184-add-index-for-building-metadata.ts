import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndexForBuildingMetadata1706475370184 implements MigrationInterface {
  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX idx_metadata_buildingId ON couchbase_document((document ->> \'buildingId\')) WHERE "documentType" = \'metadata\'')
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "public"."idx_metadata_buildingId"')
  }
}
