import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveDomainEventUpdatedAtColumn1706222354390 implements MigrationInterface {
    name = 'RemoveDomainEventUpdatedAtColumn1706222354390'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "domain_event" DROP COLUMN "updatedAt"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "domain_event" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}
