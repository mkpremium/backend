import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAspirationToProposal1705514950513 implements MigrationInterface {
    name = 'AddAspirationToProposal1705514950513'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "proposal" ADD "message" text`);
        await queryRunner.query(`ALTER TABLE "proposal" ADD "aspiration" numeric`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "proposal" DROP COLUMN "aspiration"`);
        await queryRunner.query(`ALTER TABLE "proposal" DROP COLUMN "message"`);
    }

}
