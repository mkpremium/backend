import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDefaultBuildingNegotiationStatus1705098107498 implements MigrationInterface {
  name = 'AddDefaultBuildingNegotiationStatus1705098107498'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "building"
        ALTER COLUMN "negotiationStatus" SET DEFAULT 'PENDIENTE'`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "building"
        ALTER COLUMN "negotiationStatus" DROP DEFAULT`)
  }

}
