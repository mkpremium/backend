import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOwnerType1703808571413 implements MigrationInterface {
    name = 'AddOwnerType1703808571413'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "owner" ADD "type" text NOT NULL DEFAULT 'PRINCIPAL'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "owner" DROP COLUMN "type"`);
    }

}
