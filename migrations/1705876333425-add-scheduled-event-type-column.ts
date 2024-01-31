import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddScheduledEventTypeColumn1705876333425 implements MigrationInterface {
  name = 'AddScheduledEventTypeColumn1705876333425'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "scheduled_event" ADD "type" text NOT NULL')
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "scheduled_event" DROP COLUMN "type"')
  }
}
