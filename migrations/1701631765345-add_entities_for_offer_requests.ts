import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEntitiesForOfferRequests1701631765345 implements MigrationInterface {
  name = 'AddEntitiesForOfferRequests1701631765345'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "worksheet_queue"
                             (
                                 "id"        uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                                 "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                                 CONSTRAINT "PK_7af060c122da5083bba75dae8b7" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`CREATE TABLE "contact"
                             (
                                 "id"        uuid              NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt" TIMESTAMP         NOT NULL DEFAULT now(),
                                 "updatedAt" TIMESTAMP         NOT NULL DEFAULT now(),
                                 "value"     character varying NOT NULL,
                                 "type"      text              NOT NULL,
                                 "status"    text              NOT NULL,
                                 CONSTRAINT "PK_2cbbe00f59ab6b3bb5b8d19f989" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`CREATE TABLE "caller"
                             (
                                 "id"        uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                                 "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                                 "userId"    uuid,
                                 CONSTRAINT "REL_5af202179f18fa9a956d2a65c1" UNIQUE ("userId"),
                                 CONSTRAINT "PK_3bed5e1e316e15c0b87cccd8504" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`CREATE TABLE "building_offer_request"
                             (
                                 "id"            uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
                                 "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
                                 "flipperId"     uuid,
                                 "ownerIdId"     uuid,
                                 "contactId"     uuid,
                                 "worksheetIdId" uuid,
                                 "buildingId"    uuid,
                                 "callerId"      uuid,
                                 CONSTRAINT "PK_c8c3b8279109dffb59977eaf948" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "status" text NOT NULL DEFAULT 'LOOKING_MEETING'`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "statusChangeReason" text NOT NULL DEFAULT ''`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "lastStatusChangedAt" TIMESTAMP WITH TIME ZONE`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "lastViewedAt" TIMESTAMP WITH TIME ZONE`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "buildingId" uuid`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD CONSTRAINT "UQ_d41832400de343577945fb92a5f" UNIQUE ("buildingId")`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "queueId" uuid`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD "lastViewedById" uuid`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD CONSTRAINT "FK_d41832400de343577945fb92a5f" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD CONSTRAINT "FK_943bfad047bdb6d2f67c92253cb" FOREIGN KEY ("queueId") REFERENCES "worksheet_queue" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD CONSTRAINT "FK_f7f612460e14a027386750806ba" FOREIGN KEY ("lastViewedById") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "caller"
        ADD CONSTRAINT "FK_5af202179f18fa9a956d2a65c1a" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_417a1dd7d6e461f8cf09b3b76c4" FOREIGN KEY ("flipperId") REFERENCES "flipper" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_5b6a0521da4f416bc997ad935cc" FOREIGN KEY ("ownerIdId") REFERENCES "owner" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_ff835024f875afb0b9c089cb95c" FOREIGN KEY ("contactId") REFERENCES "contact" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_926367aaeccbb7444558d73325c" FOREIGN KEY ("worksheetIdId") REFERENCES "worksheet" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_79a33ce0db1430efab0abe03347" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_offer_request"
        ADD CONSTRAINT "FK_6de29c76427033d264bae72f54f" FOREIGN KEY ("callerId") REFERENCES "caller" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_6de29c76427033d264bae72f54f"`)
    await queryRunner.query(`ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_79a33ce0db1430efab0abe03347"`)
    await queryRunner.query(`ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_926367aaeccbb7444558d73325c"`)
    await queryRunner.query(`ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_ff835024f875afb0b9c089cb95c"`)
    await queryRunner.query(`ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_5b6a0521da4f416bc997ad935cc"`)
    await queryRunner.query(`ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_417a1dd7d6e461f8cf09b3b76c4"`)
    await queryRunner.query(`ALTER TABLE "caller" DROP CONSTRAINT "FK_5af202179f18fa9a956d2a65c1a"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP CONSTRAINT "FK_f7f612460e14a027386750806ba"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP CONSTRAINT "FK_943bfad047bdb6d2f67c92253cb"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP CONSTRAINT "FK_d41832400de343577945fb92a5f"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP COLUMN "lastViewedById"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP COLUMN "queueId"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP CONSTRAINT "UQ_d41832400de343577945fb92a5f"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP COLUMN "buildingId"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP COLUMN "lastViewedAt"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP COLUMN "lastStatusChangedAt"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP COLUMN "statusChangeReason"`)
    await queryRunner.query(`ALTER TABLE "worksheet" DROP COLUMN "status"`)
    await queryRunner.query(`DROP TABLE "building_offer_request"`)
    await queryRunner.query(`DROP TABLE "caller"`)
    await queryRunner.query(`DROP TABLE "contact"`)
    await queryRunner.query(`DROP TABLE "worksheet_queue"`)
  }

}
