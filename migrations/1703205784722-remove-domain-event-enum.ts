import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveDomainEventEnum1703205784722 implements MigrationInterface {
  name = 'RemoveDomainEventEnum1703205784722'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "domain_event" ALTER COLUMN "name" TYPE text')
    await queryRunner.query('DROP TYPE "public"."domain_event_name_enum"')
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TYPE "public"."domain_event_name_enum" AS ENUM(\'building.lead_captured\', \'building.negotiation_status_changed\', \'building.proposal_scheduled\', \'offer_request.created\', \'owner.owner_added\', \'owner.contact_added\', \'owner.contact_status_changed\', \'owner.status_changed\', \'scheduled_events.call_scheduled\', \'scheduled_events.call_updated\', \'scheduled_events.event_deleted\', \'worksheet.next_in_queue_taken\', \'worksheet.taken\')')
    await queryRunner.query('ALTER TABLE "domain_event" ALTER COLUMN "name" text "public"."domain_event_name_enum" NOT NULL')
  }
}
