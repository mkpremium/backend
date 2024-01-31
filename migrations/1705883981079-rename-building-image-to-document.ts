import { MigrationInterface, QueryRunner } from 'typeorm'

export class RenameBuildingImageToDocument1705883981079 implements MigrationInterface {
  name = 'RenameBuildingImageToDocument1705883981079'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE "building_document" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "mimeType" character varying NOT NULL, "previewUrl" character varying NOT NULL, "privateUrl" character varying NOT NULL, "buildingId" uuid, CONSTRAINT "PK_8152c73edc0e5cbf9c86847cfdc" PRIMARY KEY ("id"))')
    await queryRunner.query('ALTER TABLE "building_document" ADD CONSTRAINT "FK_d754373304b77ed19bb6b8061ad" FOREIGN KEY ("buildingId") REFERENCES "building"("id") ON DELETE NO ACTION ON UPDATE NO ACTION')
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "building_document" DROP CONSTRAINT "FK_d754373304b77ed19bb6b8061ad"')
    await queryRunner.query('DROP TABLE "building_document"')
  }
}
