import { MigrationInterface, QueryRunner } from 'typeorm'

export class AllowProposalNullEmailNotification1707573591502 implements MigrationInterface {
  name = 'AllowProposalNullEmailNotification1707573591502'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "proposal"
        ALTER COLUMN "notificationEmail" DROP NOT NULL`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "proposal"
        ALTER COLUMN "notificationEmail" SET NOT NULL`)
  }
}
