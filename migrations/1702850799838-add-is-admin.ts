import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsAdmin1702850799838 implements MigrationInterface {
    name = 'AddIsAdmin1702850799838'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "isAdmin" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TYPE "public"."domain_event_name_enum" RENAME TO "domain_event_name_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."domain_event_name_enum" AS ENUM('building.lead_captured', 'building.negotiation_status_changed', 'building.proposal_scheduled', 'offer_request.created', 'owner.owner_added', 'owner.contact_added', 'owner.contact_status_changed', 'owner.status_changed', 'scheduled_events.call_scheduled', 'scheduled_events.call_updated', 'scheduled_events.event_deleted', 'worksheet.next_in_queue_taken', 'worksheet.taken')`);
        await queryRunner.query(`ALTER TABLE "domain_event" ALTER COLUMN "name" TYPE "public"."domain_event_name_enum" USING "name"::"text"::"public"."domain_event_name_enum"`);
        await queryRunner.query(`DROP TYPE "public"."domain_event_name_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."domain_event_name_enum_old" AS ENUM('building.lead_captured', 'building.negotiation_status_changed', 'building.proposal_scheduled', 'offer_request.created', 'owner.contact_status_changed', 'owner.status_changed', 'scheduled_events.event_deleted', 'scheduled_events.call_scheduled', 'scheduled_events.call_updated', 'worksheet.taken', 'worksheet.next_in_queue_taken')`);
        await queryRunner.query(`ALTER TABLE "domain_event" ALTER COLUMN "name" TYPE "public"."domain_event_name_enum_old" USING "name"::"text"::"public"."domain_event_name_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."domain_event_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."domain_event_name_enum_old" RENAME TO "domain_event_name_enum"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isAdmin"`);
    }

}
