import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContactsToOwner1701632452454 implements MigrationInterface {
    name = 'AddContactsToOwner1701632452454'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "owner_contact"
                                 (
                                     "id"        uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                     "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                                     "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                                     "status"    text      NOT NULL,
                                     "ownerId"   uuid,
                                     "contactId" uuid,
                                     CONSTRAINT "PK_b03981c8aaaa7bd29703670845d" PRIMARY KEY ("id")
                                 )`);
        await queryRunner.query(`ALTER TABLE "contact" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "owner_contact" ADD CONSTRAINT "FK_6391f9bdcc6babea2da33175800" FOREIGN KEY ("ownerId") REFERENCES "owner"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "owner_contact" ADD CONSTRAINT "FK_1d9c06943de9947636656d1dad2" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "owner_contact" DROP CONSTRAINT "FK_1d9c06943de9947636656d1dad2"`);
        await queryRunner.query(`ALTER TABLE "owner_contact" DROP CONSTRAINT "FK_6391f9bdcc6babea2da33175800"`);
        await queryRunner.query(`ALTER TABLE "contact" ADD "status" text NOT NULL`);
        await queryRunner.query(`DROP TABLE "owner_contact"`);
    }

}
