import { MigrationInterface, QueryRunner } from "typeorm"

export class AddIndexForOwnerBuilding1706474801946 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          `CREATE INDEX idx_owner_buildingId ON couchbase_document ((document ->> 'buildingId')) WHERE "documentType" = 'owner'`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_owner_buildingId"`)
    }

}
