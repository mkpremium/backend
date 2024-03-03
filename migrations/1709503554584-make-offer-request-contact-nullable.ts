import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeOfferRequestContactNullable1709503554584 implements MigrationInterface {
    name = 'MakeOfferRequestContactNullable1709503554584'

    public async up (queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_ff835024f875afb0b9c089cb95c"')
      await queryRunner.query('ALTER TABLE "building_offer_request" ALTER COLUMN "contactId" DROP NOT NULL')
      await queryRunner.query('ALTER TABLE "building_offer_request" ADD CONSTRAINT "FK_ff835024f875afb0b9c089cb95c" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE NO ACTION ON UPDATE NO ACTION')
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_ff835024f875afb0b9c089cb95c"')
      await queryRunner.query(`ALTER TABLE "building_offer_request"
            ALTER COLUMN "contactId" SET NOT NULL`)
      await queryRunner.query('ALTER TABLE "building_offer_request" ADD CONSTRAINT "FK_ff835024f875afb0b9c089cb95c" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE NO ACTION ON UPDATE NO ACTION')
    }
}
