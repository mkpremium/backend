import { MigrationInterface, QueryRunner } from 'typeorm'

export class OwnersAndBuildingsRel1701549156238 implements MigrationInterface {
  name = 'OwnersAndBuildingsRel1701549156238'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "building_to_owner"
                             (
                                 "id"         uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                 "buildingId" uuid,
                                 "ownerId"    uuid,
                                 "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
                                 "updatedAt"  TIMESTAMP NOT NULL DEFAULT now(),
                                 CONSTRAINT "PK_c84cb164bd18cfd56f5e3a9ad07" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`ALTER TABLE "building_to_owner"
        ADD CONSTRAINT "FK_61bce73d5e3b2ab9e42745645c4" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_to_owner"
        ADD CONSTRAINT "FK_7f8e536ded7a108c65398334c6b" FOREIGN KEY ("ownerId") REFERENCES "owner" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "building_to_owner" DROP CONSTRAINT "FK_7f8e536ded7a108c65398334c6b"`)
    await queryRunner.query(`ALTER TABLE "building_to_owner" DROP CONSTRAINT "FK_61bce73d5e3b2ab9e42745645c4"`)
    await queryRunner.query(`DROP TABLE "building_to_owner"`)
  }

}
