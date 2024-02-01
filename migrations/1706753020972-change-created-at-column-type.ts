import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeCreatedAtColumnType1706753020972 implements MigrationInterface {
  name = 'ChangeCreatedAtColumnType1706753020972'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "building_document"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "building_document"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "building_document"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "building_document"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "contact"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "contact"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "contact"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "contact"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "person_contact"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "person_contact"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "person_contact"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "person_contact"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "person"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "person"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "person"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "person"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "owner"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "owner"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "owner"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "owner"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "caller"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "caller"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "caller"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "caller"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "user"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "user"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "user"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "user"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "flipper"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "flipper"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "flipper"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "flipper"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "proposal"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "proposal"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "proposal"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "proposal"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "worksheet_queue"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "worksheet_queue"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "worksheet_queue"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "worksheet_queue"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "building"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "building"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "building"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "building"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "building_note"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "building_note"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "building_note"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "building_note"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "couchbase_document"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "couchbase_document"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "couchbase_document"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "couchbase_document"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        DROP COLUMN "scheduledFor"`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        ADD "scheduledFor" TIMESTAMP WITH TIME ZONE NOT NULL`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        DROP COLUMN "scheduledFor"`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        ADD "scheduledFor" TIMESTAMP NOT NULL`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "couchbase_document"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "couchbase_document"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "couchbase_document"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "couchbase_document"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "building_note"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "building_note"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "building_note"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "building_note"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "building"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "building"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "building"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "building"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "worksheet_queue"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "worksheet_queue"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "worksheet_queue"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "worksheet_queue"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "proposal"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "proposal"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "proposal"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "proposal"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "flipper"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "flipper"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "flipper"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "flipper"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "user"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "user"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "user"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "user"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "caller"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "caller"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "caller"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "caller"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "owner"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "owner"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "owner"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "owner"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "person"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "person"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "person"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "person"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "person_contact"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "person_contact"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "person_contact"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "person_contact"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "contact"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "contact"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "contact"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "contact"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "building_document"
        DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "building_document"
        ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`)
    await queryRunner.query(`ALTER TABLE "building_document"
        DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "building_document"
        ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`)
  }
}
