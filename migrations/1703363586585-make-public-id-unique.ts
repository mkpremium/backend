import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakePublicIdUnique1703363586585 implements MigrationInterface {
  name = 'MakePublicIdUnique1703363586585'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "building"
        ADD CONSTRAINT "UQ_7b13d552bdbd1f6d8608ab6054e" UNIQUE ("publicIdentifier")`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "building" DROP CONSTRAINT "UQ_7b13d552bdbd1f6d8608ab6054e"`)
  }

}
