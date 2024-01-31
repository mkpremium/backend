import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddNameToWorksheetQueue1703363521273 implements MigrationInterface {
  name = 'AddNameToWorksheetQueue1703363521273'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "worksheet_queue"
        ADD "name" character varying NOT NULL`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "worksheet_queue" DROP COLUMN "name"')
  }
}
