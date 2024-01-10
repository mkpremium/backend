import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBuildingNotes1704851816878 implements MigrationInterface {
    name = 'AddBuildingNotes1704851816878'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "building_note" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "note" character varying NOT NULL, "buildingId" uuid, "createdById" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdByCreatedat" TIMESTAMP NOT NULL DEFAULT now(), "createdByUpdatedat" TIMESTAMP NOT NULL DEFAULT now(), "createdByUsername" character varying NOT NULL, "createdByPassword" character varying NOT NULL, "createdByEnabled" boolean NOT NULL, "createdByProfile" jsonb NOT NULL, "createdByIsadmin" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_36a5f0bdcaaf50ab0bf0b206269" UNIQUE ("createdByUsername"), CONSTRAINT "PK_364fa85389c60d6dba3fb397f89" PRIMARY KEY ("id", "createdById"))`);
        await queryRunner.query(`ALTER TABLE "building_note" ADD CONSTRAINT "FK_da212aba77c2f740df508849a70" FOREIGN KEY ("buildingId") REFERENCES "building"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "building_note" DROP CONSTRAINT "FK_da212aba77c2f740df508849a70"`);
        await queryRunner.query(`DROP TABLE "building_note"`);
    }

}
