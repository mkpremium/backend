import { MigrationInterface, QueryRunner } from 'typeorm'

export class OwnersAndBuildingsRel1701547953606 implements MigrationInterface {
  name = 'OwnersAndBuildingsRel1701547953606'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "building_owners_owner"
                             (
                                 "buildingId" uuid NOT NULL,
                                 "ownerId"    uuid NOT NULL,
                                 CONSTRAINT "PK_657733c293ac6fea4f1fd963773" PRIMARY KEY ("buildingId", "ownerId")
                             )`)
    await queryRunner.query(`CREATE INDEX "IDX_95beb91773393bfd81be0a6332" ON "building_owners_owner" ("buildingId") `)
    await queryRunner.query(`CREATE INDEX "IDX_7c15ada7e4a16e0edbc58948b3" ON "building_owners_owner" ("ownerId") `)
    await queryRunner.query(`ALTER TABLE "building_owners_owner"
        ADD CONSTRAINT "FK_95beb91773393bfd81be0a63324" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE CASCADE ON UPDATE CASCADE`)
    await queryRunner.query(`ALTER TABLE "building_owners_owner"
        ADD CONSTRAINT "FK_7c15ada7e4a16e0edbc58948b32" FOREIGN KEY ("ownerId") REFERENCES "owner" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "building_owners_owner" DROP CONSTRAINT "FK_7c15ada7e4a16e0edbc58948b32"`)
    await queryRunner.query(`ALTER TABLE "building_owners_owner" DROP CONSTRAINT "FK_95beb91773393bfd81be0a63324"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_7c15ada7e4a16e0edbc58948b3"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_95beb91773393bfd81be0a6332"`)
    await queryRunner.query(`DROP TABLE "building_owners_owner"`)
  }

}
