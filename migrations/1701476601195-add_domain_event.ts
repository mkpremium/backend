import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDomainEvent1701476601195 implements MigrationInterface {
  name = 'AddDomainEvent1701476601195'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."domain_event_name_enum" AS ENUM('building.lead_captured', 'building.negotiation_status_changed', 'building.proposal_scheduled', 'offer_request.created', 'owner.contact_status_changed', 'owner.status_changed', 'scheduled_events.event_deleted', 'scheduled_events.call_scheduled', 'scheduled_events.call_updated', 'worksheet.taken', 'worksheet.next_in_queue_taken')`
    )
    await queryRunner.query(
      `CREATE TABLE "domain_event"
       (
           "id"        uuid                              NOT NULL DEFAULT uuid_generate_v4(),
           "name"      "public"."domain_event_name_enum" NOT NULL,
           "version"   character varying                 NOT NULL DEFAULT 'unknwon',
           "body"      jsonb                             NOT NULL,
           "createdAt" TIMESTAMP                         NOT NULL DEFAULT now(),
           "updatedAt" TIMESTAMP                         NOT NULL DEFAULT now(),
           CONSTRAINT "PK_f901502d0301da69fb8cebbb8f2" PRIMARY KEY ("id")
       )`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "domain_event"`)
    await queryRunner.query(`DROP TYPE "public"."domain_event_name_enum"`)
  }

}
