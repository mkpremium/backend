import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStockEntity1707346579226 implements MigrationInterface {
  name = 'AddStockEntity1707346579226'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "stock"
                             (
                                 "id"            uuid                                NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt"     TIMESTAMP WITH TIME ZONE            NOT NULL DEFAULT now(),
                                 "updatedAt"     TIMESTAMP WITH TIME ZONE            NOT NULL DEFAULT now(),
                                 "currentStatus" "public"."stock_currentstatus_enum" NOT NULL,
                                 "purchase"      jsonb,
                                 "salePrice"     numeric(10, 2),
                                 "sell"          jsonb,
                                 "close"         jsonb,
                                 "buildingId"    uuid,
                                 CONSTRAINT "PK_092bc1fc7d860426a1dec5aa8e9" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`ALTER TABLE "stock"
        ADD CONSTRAINT "FK_bd099cadabf21e56418b5eef538" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stock"
        DROP CONSTRAINT "FK_bd099cadabf21e56418b5eef538"`)
    await queryRunner.query('DROP TABLE "stock"')
  }
}
