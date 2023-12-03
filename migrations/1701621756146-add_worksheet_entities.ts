import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddWorksheetEntities1701621756146 implements MigrationInterface {
  name = 'AddWorksheetEntities1701621756146'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "worksheet_queue"
                             (
                                 "id"        uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                                 "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                                 CONSTRAINT "PK_7af060c122da5083bba75dae8b7" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "status" text NOT NULL DEFAULT 'LOOKING_MEETING'`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "statusChangeReason" text NOT NULL DEFAULT ''`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "lastStatusChangedAt" TIMESTAMP WITH TIME ZONE`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "lastViewedAt" TIMESTAMP WITH TIME ZONE`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "buildingId" uuid`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD CONSTRAINT "UQ_d41832400de343577945fb92a5f" UNIQUE ("buildingId")`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "queueId" uuid`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "lastViewedById" uuid`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD CONSTRAINT "FK_d41832400de343577945fb92a5f" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD CONSTRAINT "FK_943bfad047bdb6d2f67c92253cb" FOREIGN KEY ("queueId") REFERENCES "worksheet_queue" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD CONSTRAINT "FK_f7f612460e14a027386750806ba" FOREIGN KEY ("lastViewedById") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "worksheet" DROP CONSTRAINT "FK_f7f612460e14a027386750806ba"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP CONSTRAINT "FK_943bfad047bdb6d2f67c92253cb"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP CONSTRAINT "FK_d41832400de343577945fb92a5f"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP COLUMN "lastViewedById"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP COLUMN "queueId"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP CONSTRAINT "UQ_d41832400de343577945fb92a5f"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP COLUMN "buildingId"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP COLUMN "lastViewedAt"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP COLUMN "lastStatusChangedAt"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP COLUMN "statusChangeReason"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP COLUMN "status"`)
    await queryRunner.query(`DROP TABLE "worksheet_queue"`)
  }

}
