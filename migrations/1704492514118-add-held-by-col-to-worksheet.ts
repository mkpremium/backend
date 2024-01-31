import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddHeldByColToWorksheet1704492514118 implements MigrationInterface {
  name = 'AddHeldByColToWorksheet1704492514118'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "heldById" uuid`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD CONSTRAINT "FK_2981287144270cebf03bfe13714" FOREIGN KEY ("heldById") REFERENCES "caller" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "worksheet" DROP CONSTRAINT "FK_2981287144270cebf03bfe13714"')
    await queryRunner.query('ALTER TABLE "worksheet" DROP COLUMN "heldById"')
  }
}
