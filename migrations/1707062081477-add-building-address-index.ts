import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBuildingAddressIndex1707062081477 implements MigrationInterface {
  name = 'AddBuildingAddressIndex1707062081477'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE INDEX "IDX_512c5a4d8188416d8e4b26087e" ON "building" (("address" ->> \'province\')) ')
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "public"."IDX_512c5a4d8188416d8e4b26087e"')
  }
}
