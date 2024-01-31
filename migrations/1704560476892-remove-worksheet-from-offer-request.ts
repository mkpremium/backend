import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveWorksheetFromOfferRequest1704560476892 implements MigrationInterface {
  name = 'RemoveWorksheetFromOfferRequest1704560476892'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_bdec32cc92d6840e27a79322457"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP COLUMN "worksheetId"')
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "building_offer_request" ADD "worksheetId" uuid NOT NULL')
    await queryRunner.query('ALTER TABLE "building_offer_request" ADD CONSTRAINT "FK_bdec32cc92d6840e27a79322457" FOREIGN KEY ("worksheetId") REFERENCES "worksheet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION')
  }
}
