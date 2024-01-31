import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAspirationToProposal1705656202388 implements MigrationInterface {
  name = 'AddAspirationToProposal1705656202388'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "proposal" ADD "aspiration" numeric')
    await queryRunner.query('ALTER TABLE "proposal" ALTER COLUMN "message" DROP NOT NULL')
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "proposal" ALTER COLUMN "message" SET NOT NULL')
    await queryRunner.query('ALTER TABLE "proposal" DROP COLUMN "aspiration"')
  }
}
