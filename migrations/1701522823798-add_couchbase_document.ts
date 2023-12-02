import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCouchbaseDocument1701522823798 implements MigrationInterface {
  name = 'AddCouchbaseDocument1701522823798'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."couchbase_document_documenttype_enum" AS ENUM('building', 'building-proposal', 'note', 'metadata', 'operator', 'owner', 'scheduled-event', 'stock', 'worksheet', 'worksheet-queue', 'building-owner-phone', 'bank-file-data', 'bank-file', 'cadastre-cache', 'history', 'operator-stats', 'owner-outgoing-sms', 'person', 'portugal-2021-owner-phone', 'system-preferences', 'virtual-agent-call', 'virtual-call-worksheet', 'virtual-caller', 'virtual-caller-phone', 'worksheet-wo-buildings', 'portugal-2021-building', 'calls', 'calls-raw-events', 'operator-refresh_token', 'bank-city-data')`)
    await queryRunner.query(`CREATE TABLE "couchbase_document"
                             (
                                 "id"           uuid                                            NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt"    TIMESTAMP                                       NOT NULL DEFAULT now(),
                                 "updatedAt"    TIMESTAMP                                       NOT NULL DEFAULT now(),
                                 "documentType" "public"."couchbase_document_documenttype_enum" NOT NULL,
                                 "document"     jsonb                                           NOT NULL,
                                 CONSTRAINT "PK_167cf8789e04031143852f85fc6" PRIMARY KEY ("id")
                             )`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "couchbase_document"`)
    await queryRunner.query(`DROP TYPE "public"."couchbase_document_documenttype_enum"`)
  }

}
