import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOwnerType1703806644308 implements MigrationInterface {
    name = 'AddOwnerType1703806644308'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "owner" ADD "type" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "owner" DROP COLUMN "type"`);
    }

}
