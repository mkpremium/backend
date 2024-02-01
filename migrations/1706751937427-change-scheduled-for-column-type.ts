import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeScheduledForColumnType1706751937427 implements MigrationInterface {
  name = 'ChangeScheduledForColumnType1706751937427'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        DROP COLUMN "scheduledFor"`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        ADD "scheduledFor" TIMESTAMP WITH TIME ZONE NOT NULL`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        DROP COLUMN "scheduledFor"`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        ADD "scheduledFor" TIMESTAMP NOT NULL`)
  }
}
