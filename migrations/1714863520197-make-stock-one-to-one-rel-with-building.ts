import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeStockOneToOneRelWithBuilding1714863520197 implements MigrationInterface {
  name = 'MakeStockOneToOneRelWithBuilding1714863520197'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stock"
        DROP CONSTRAINT "FK_bd099cadabf21e56418b5eef538"`)
    await queryRunner.query(`ALTER TABLE "stock"
        ADD CONSTRAINT "UQ_bd099cadabf21e56418b5eef538" UNIQUE ("buildingId")`)
    await queryRunner.query(`ALTER TABLE "stock"
        ADD CONSTRAINT "FK_bd099cadabf21e56418b5eef538" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stock"
        DROP CONSTRAINT "FK_bd099cadabf21e56418b5eef538"`)
    await queryRunner.query(`ALTER TABLE "stock"
        DROP CONSTRAINT "UQ_bd099cadabf21e56418b5eef538"`)
    await queryRunner.query(`ALTER TABLE "stock"
        ADD CONSTRAINT "FK_bd099cadabf21e56418b5eef538" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }
}
