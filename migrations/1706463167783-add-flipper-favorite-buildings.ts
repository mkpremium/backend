import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlipperFavoriteBuildings1706463167783 implements MigrationInterface {
  name = 'AddFlipperFavoriteBuildings1706463167783'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "flipper_favorite_buildings_building"
                             (
                                 "flipperId"  uuid NOT NULL,
                                 "buildingId" uuid NOT NULL,
                                 CONSTRAINT "PK_1066b4a1b26dedf6d87ba7fc925" PRIMARY KEY ("flipperId", "buildingId")
                             )`)
    await queryRunner.query(`CREATE INDEX "IDX_aece5aaf83b6c50f65e433687f" ON "flipper_favorite_buildings_building" ("flipperId") `)
    await queryRunner.query(`CREATE INDEX "IDX_6338089937ec1a05cbe45c9117" ON "flipper_favorite_buildings_building" ("buildingId") `)
    await queryRunner.query(`ALTER TABLE "flipper_favorite_buildings_building"
        ADD CONSTRAINT "FK_aece5aaf83b6c50f65e433687fe" FOREIGN KEY ("flipperId") REFERENCES "flipper" ("id") ON DELETE CASCADE ON UPDATE CASCADE`)
    await queryRunner.query(`ALTER TABLE "flipper_favorite_buildings_building"
        ADD CONSTRAINT "FK_6338089937ec1a05cbe45c91174" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE CASCADE ON UPDATE CASCADE`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "flipper_favorite_buildings_building"
        DROP CONSTRAINT "FK_6338089937ec1a05cbe45c91174"`)
    await queryRunner.query(`ALTER TABLE "flipper_favorite_buildings_building"
        DROP CONSTRAINT "FK_aece5aaf83b6c50f65e433687fe"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_6338089937ec1a05cbe45c9117"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_aece5aaf83b6c50f65e433687f"`)
    await queryRunner.query(`DROP TABLE "flipper_favorite_buildings_building"`)
  }

}
