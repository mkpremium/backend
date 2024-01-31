import { MigrationInterface, QueryRunner } from 'typeorm'

export class FixBuildingOfferEntityDefinition1704121159901 implements MigrationInterface {
  name = 'FixBuildingOfferEntityDefinition1704121159901'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_926367aaeccbb7444558d73325c"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_5b6a0521da4f416bc997ad935cc"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP COLUMN "ownerIdId"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP COLUMN "worksheetIdId"')
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD "ownerId" uuid NOT NULL`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD "worksheetId" uuid NOT NULL`)
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_417a1dd7d6e461f8cf09b3b76c4"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_ff835024f875afb0b9c089cb95c"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_79a33ce0db1430efab0abe03347"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_6de29c76427033d264bae72f54f"')
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ALTER COLUMN "flipperId" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ALTER COLUMN "contactId" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ALTER COLUMN "buildingId" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ALTER COLUMN "callerId" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_417a1dd7d6e461f8cf09b3b76c4" FOREIGN KEY ("flipperId") REFERENCES "flipper" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_62f127d0ea2d791a5e1b3070efe" FOREIGN KEY ("ownerId") REFERENCES "owner" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_ff835024f875afb0b9c089cb95c" FOREIGN KEY ("contactId") REFERENCES "contact" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_bdec32cc92d6840e27a79322457" FOREIGN KEY ("worksheetId") REFERENCES "worksheet" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_79a33ce0db1430efab0abe03347" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_6de29c76427033d264bae72f54f" FOREIGN KEY ("callerId") REFERENCES "caller" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_6de29c76427033d264bae72f54f"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_79a33ce0db1430efab0abe03347"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_bdec32cc92d6840e27a79322457"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_ff835024f875afb0b9c089cb95c"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_62f127d0ea2d791a5e1b3070efe"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_417a1dd7d6e461f8cf09b3b76c4"')
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ALTER COLUMN "callerId" DROP NOT NULL`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ALTER COLUMN "buildingId" DROP NOT NULL`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ALTER COLUMN "contactId" DROP NOT NULL`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ALTER COLUMN "flipperId" DROP NOT NULL`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_6de29c76427033d264bae72f54f" FOREIGN KEY ("callerId") REFERENCES "caller" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_79a33ce0db1430efab0abe03347" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_ff835024f875afb0b9c089cb95c" FOREIGN KEY ("contactId") REFERENCES "contact" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_417a1dd7d6e461f8cf09b3b76c4" FOREIGN KEY ("flipperId") REFERENCES "flipper" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP COLUMN "worksheetId"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP COLUMN "ownerId"')
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD "worksheetIdId" uuid`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD "ownerIdId" uuid`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_5b6a0521da4f416bc997ad935cc" FOREIGN KEY ("ownerIdId") REFERENCES "owner" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_926367aaeccbb7444558d73325c" FOREIGN KEY ("worksheetIdId") REFERENCES "worksheet" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }
}
