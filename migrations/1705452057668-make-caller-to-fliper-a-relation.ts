import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeCallerToFliperARelation1705452057668 implements MigrationInterface {
  name = 'MakeCallerToFliperARelation1705452057668'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "caller"
      ADD "flipperId" uuid`)
    await queryRunner.query(`ALTER TABLE "caller"
      ADD CONSTRAINT "FK_268f16b5045e5a10e497d5c40a2" FOREIGN KEY ("flipperId") REFERENCES "flipper" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "caller" DROP CONSTRAINT "FK_268f16b5045e5a10e497d5c40a2"')
    await queryRunner.query('ALTER TABLE "caller" DROP COLUMN "flipperId"')
  }
}
