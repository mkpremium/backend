import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeNoteAuthorARelationship1705266163466 implements MigrationInterface {
  name = 'MakeNoteAuthorARelationship1705266163466'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "building_note" DROP CONSTRAINT "PK_364fa85389c60d6dba3fb397f89"')
    await queryRunner.query('ALTER TABLE "building_note" ADD CONSTRAINT "PK_6641446c93c3f2759db0c3d7142" PRIMARY KEY ("id")')
    await queryRunner.query('ALTER TABLE "building_note" DROP COLUMN "createdById"')
    await queryRunner.query('ALTER TABLE "building_note" DROP COLUMN "createdByCreatedat"')
    await queryRunner.query('ALTER TABLE "building_note" DROP COLUMN "createdByUpdatedat"')
    await queryRunner.query('ALTER TABLE "building_note" DROP COLUMN "createdByEnabled"')
    await queryRunner.query('ALTER TABLE "building_note" DROP COLUMN "createdByProfile"')
    await queryRunner.query('ALTER TABLE "building_note" DROP COLUMN "createdByIsadmin"')
    await queryRunner.query('ALTER TABLE "building_note" DROP COLUMN "createdByPassword"')
    await queryRunner.query('ALTER TABLE "building_note" DROP CONSTRAINT "UQ_36a5f0bdcaaf50ab0bf0b206269"')
    await queryRunner.query('ALTER TABLE "building_note" DROP COLUMN "createdByUsername"')
    await queryRunner.query('ALTER TABLE "building_note" ADD "authorId" uuid')
    await queryRunner.query('ALTER TABLE "building_note" ADD CONSTRAINT "FK_289c9e8eeea66fcefde4711b3bc" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION')
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "building_note" DROP CONSTRAINT "FK_289c9e8eeea66fcefde4711b3bc"')
    await queryRunner.query('ALTER TABLE "building_note" DROP COLUMN "authorId"')
    await queryRunner.query('ALTER TABLE "building_note" ADD "createdByUsername" character varying NOT NULL')
    await queryRunner.query('ALTER TABLE "building_note" ADD CONSTRAINT "UQ_36a5f0bdcaaf50ab0bf0b206269" UNIQUE ("createdByUsername")')
    await queryRunner.query('ALTER TABLE "building_note" ADD "createdByPassword" character varying NOT NULL')
    await queryRunner.query('ALTER TABLE "building_note" ADD "createdByIsadmin" boolean NOT NULL DEFAULT false')
    await queryRunner.query('ALTER TABLE "building_note" ADD "createdByProfile" jsonb NOT NULL')
    await queryRunner.query('ALTER TABLE "building_note" ADD "createdByEnabled" boolean NOT NULL')
    await queryRunner.query('ALTER TABLE "building_note" ADD "createdByUpdatedat" TIMESTAMP NOT NULL DEFAULT now()')
    await queryRunner.query('ALTER TABLE "building_note" ADD "createdByCreatedat" TIMESTAMP NOT NULL DEFAULT now()')
    await queryRunner.query('ALTER TABLE "building_note" ADD "createdById" uuid NOT NULL DEFAULT uuid_generate_v4()')
    await queryRunner.query('ALTER TABLE "building_note" DROP CONSTRAINT "PK_6641446c93c3f2759db0c3d7142"')
    await queryRunner.query('ALTER TABLE "building_note" ADD CONSTRAINT "PK_364fa85389c60d6dba3fb397f89" PRIMARY KEY ("createdById", "id")')
  }
}
