import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddScheduledEvent1704548287169 implements MigrationInterface {
  name = 'AddScheduledEvent1704548287169'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "scheduled_event"
                             (
                                 "id"           uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
                                 "updatedAt"    TIMESTAMP NOT NULL DEFAULT now(),
                                 "scheduledFor" TIMESTAMP NOT NULL,
                                 "notifyToId"   uuid,
                                 "createdById"  uuid,
                                 "buildingId"   uuid,
                                 "ownerId"      uuid,
                                 "contactId"    uuid,
                                 CONSTRAINT "PK_59a1f1e0d902729bdfe3d02c089" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        ADD CONSTRAINT "FK_612f5f9915cdf4f080e26c91baa" FOREIGN KEY ("notifyToId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        ADD CONSTRAINT "FK_7e8ecc7b42e3da6d0089a24b930" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        ADD CONSTRAINT "FK_bd8cc4cf6e6b0da3fc3fc82776e" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        ADD CONSTRAINT "FK_4b1a34b55b6f96b5eb3df945e55" FOREIGN KEY ("ownerId") REFERENCES "owner" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "scheduled_event"
        ADD CONSTRAINT "FK_e295e8b554994ff51e9b78afc68" FOREIGN KEY ("contactId") REFERENCES "contact" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scheduled_event" DROP CONSTRAINT "FK_e295e8b554994ff51e9b78afc68"`)
    await queryRunner.query(`ALTER TABLE "scheduled_event" DROP CONSTRAINT "FK_4b1a34b55b6f96b5eb3df945e55"`)
    await queryRunner.query(`ALTER TABLE "scheduled_event" DROP CONSTRAINT "FK_bd8cc4cf6e6b0da3fc3fc82776e"`)
    await queryRunner.query(`ALTER TABLE "scheduled_event" DROP CONSTRAINT "FK_7e8ecc7b42e3da6d0089a24b930"`)
    await queryRunner.query(`ALTER TABLE "scheduled_event" DROP CONSTRAINT "FK_612f5f9915cdf4f080e26c91baa"`)
    await queryRunner.query(`DROP TABLE "scheduled_event"`)
  }

}
