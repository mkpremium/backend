import { MigrationInterface, QueryRunner } from 'typeorm'

export class Initial1702240253798 implements MigrationInterface {
  name = 'Initial1702240253798'

  public async up (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "contact"
                             (
                                 "id"        uuid              NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt" TIMESTAMP         NOT NULL DEFAULT now(),
                                 "updatedAt" TIMESTAMP         NOT NULL DEFAULT now(),
                                 "value"     character varying NOT NULL,
                                 "type"      text              NOT NULL,
                                 CONSTRAINT "UQ_773375ae684fad1675026413148" UNIQUE ("value"),
                                 CONSTRAINT "PK_2cbbe00f59ab6b3bb5b8d19f989" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`CREATE TABLE "person_contact"
                             (
                                 "id"        uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                                 "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                                 "status"    text      NOT NULL,
                                 "personId"  uuid,
                                 "contactId" uuid,
                                 CONSTRAINT "PK_1094fd036d694f9949ef1c19e39" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query('CREATE UNIQUE INDEX "IDX_6efff9588a3f4f512e71d42332" ON "person_contact" ("personId", "contactId") ')
    await queryRunner.query(`CREATE TABLE "person"
                             (
                                 "id"                     uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
                                 "updatedAt"              TIMESTAMP NOT NULL DEFAULT now(),
                                 "fullName"               text      NOT NULL,
                                 "firstName"              text      NOT NULL,
                                 "lastName"               text      NOT NULL,
                                 "documentNumber"         text,
                                 "featuredPhoneContactId" uuid,
                                 "featuredEmailContactId" uuid,
                                 CONSTRAINT "UQ_15d02c6b69a737581647a6239d0" UNIQUE ("documentNumber"),
                                 CONSTRAINT "PK_5fdaf670315c4b7e70cce85daa3" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`CREATE TABLE "owner"
                             (
                                 "id"         uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
                                 "updatedAt"  TIMESTAMP NOT NULL DEFAULT now(),
                                 "status"     text      NOT NULL DEFAULT 'NO_VERIFICADO',
                                 "personId"   uuid,
                                 "buildingId" uuid,
                                 CONSTRAINT "REL_79cecec1b41e0109f0b5930157" UNIQUE ("personId"),
                                 CONSTRAINT "PK_8e86b6b9f94aece7d12d465dc0c" PRIMARY KEY ("id")
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
    await queryRunner.query(`CREATE TABLE "user"
                             (
                                 "id"        uuid              NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt" TIMESTAMP         NOT NULL DEFAULT now(),
                                 "updatedAt" TIMESTAMP         NOT NULL DEFAULT now(),
                                 "username"  character varying NOT NULL,
                                 "password"  character varying NOT NULL,
                                 "enabled"   boolean           NOT NULL,
                                 "profile"   jsonb             NOT NULL,
                                 CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"),
                                 CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`CREATE TABLE "flipper"
                             (
                                 "id"        uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                                 "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                                 "userId"    uuid,
                                 CONSTRAINT "REL_c24f1f24cf3eab2db55f501baf" UNIQUE ("userId"),
                                 CONSTRAINT "PK_31c0dd97d9dd4d7040845f4a6bd" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`CREATE TABLE "proposal"
                             (
                                 "id"                 uuid              NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt"          TIMESTAMP         NOT NULL DEFAULT now(),
                                 "updatedAt"          TIMESTAMP         NOT NULL DEFAULT now(),
                                 "status"             text              NOT NULL,
                                 "amount"             numeric(10, 2)    NOT NULL,
                                 "notificationEmail"  character varying NOT NULL,
                                 "notificationStatus" text              NOT NULL,
                                 "notificationSentAt" TIMESTAMP WITH TIME ZONE,
                                 "message"            text              NOT NULL,
                                 "buildingId"         uuid,
                                 "ownerId"            uuid,
                                 "authorId"           uuid,
                                 CONSTRAINT "PK_ca872ecfe4fef5720d2d39e4275" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`CREATE TABLE "worksheet_queue"
                             (
                                 "id"        uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                                 "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                                 CONSTRAINT "PK_7af060c122da5083bba75dae8b7" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`CREATE TABLE "worksheet"
                             (
                                 "id"                  uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt"           TIMESTAMP NOT NULL DEFAULT now(),
                                 "updatedAt"           TIMESTAMP NOT NULL DEFAULT now(),
                                 "status"              text      NOT NULL DEFAULT 'LOOKING_MEETING',
                                 "statusChangeReason"  text      NOT NULL DEFAULT '',
                                 "lastStatusChangedAt" TIMESTAMP WITH TIME ZONE,
                                 "lastViewedAt"        TIMESTAMP WITH TIME ZONE,
                                 "buildingId"          uuid,
                                 "queueId"             uuid,
                                 "lastViewedById"      uuid,
                                 CONSTRAINT "REL_d41832400de343577945fb92a5" UNIQUE ("buildingId"),
                                 CONSTRAINT "PK_4288372d711457f58abb7dd90c5" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`CREATE TABLE "building"
                             (
                                 "id"                uuid              NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt"         TIMESTAMP         NOT NULL DEFAULT now(),
                                 "updatedAt"         TIMESTAMP         NOT NULL DEFAULT now(),
                                 "address"           jsonb             NOT NULL,
                                 "negotiationStatus" character varying NOT NULL,
                                 "lead"              jsonb,
                                 "floorArea"         double precision,
                                 "publicIdentifier"  character varying,
                                 "location"          jsonb,
                                 "use"               character varying,
                                 "featuredOwnerId"   uuid,
                                 "assignedFlipperId" uuid,
                                 CONSTRAINT "PK_bbfaf6c11f141a22d2ab105ee5f" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`CREATE TABLE "building_image"
                             (
                                 "id"         uuid              NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt"  TIMESTAMP         NOT NULL DEFAULT now(),
                                 "updatedAt"  TIMESTAMP         NOT NULL DEFAULT now(),
                                 "name"       character varying NOT NULL,
                                 "mimeType"   character varying NOT NULL,
                                 "previewUrl" character varying NOT NULL,
                                 "buildingId" uuid,
                                 CONSTRAINT "PK_6f66f5b28658e40a840a924795a" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`CREATE TABLE "domain_event"
                             (
                                 "id"        uuid                              NOT NULL DEFAULT uuid_generate_v4(),
                                 "name"      "public"."domain_event_name_enum" NOT NULL,
                                 "version"   character varying                 NOT NULL DEFAULT 'unknwon',
                                 "body"      jsonb                             NOT NULL,
                                 "createdAt" TIMESTAMP                         NOT NULL DEFAULT now(),
                                 "updatedAt" TIMESTAMP                         NOT NULL DEFAULT now(),
                                 CONSTRAINT "PK_f901502d0301da69fb8cebbb8f2" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`CREATE TABLE "couchbase_document"
                             (
                                 "id"           uuid                                            NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt"    TIMESTAMP                                       NOT NULL DEFAULT now(),
                                 "updatedAt"    TIMESTAMP                                       NOT NULL DEFAULT now(),
                                 "documentType" "public"."couchbase_document_documenttype_enum" NOT NULL,
                                 "document"     jsonb                                           NOT NULL,
                                 CONSTRAINT "PK_167cf8789e04031143852f85fc6" PRIMARY KEY ("id")
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
    await queryRunner.query(`ALTER TABLE "person_contact"
        ADD CONSTRAINT "FK_df8723423f0c007013d5b8574d3" FOREIGN KEY ("personId") REFERENCES "person" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "person_contact"
        ADD CONSTRAINT "FK_b980ce9822fc63144b4c25aa6a6" FOREIGN KEY ("contactId") REFERENCES "contact" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "person"
        ADD CONSTRAINT "FK_024709dd88626ea768a435db470" FOREIGN KEY ("featuredPhoneContactId") REFERENCES "contact" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "person"
        ADD CONSTRAINT "FK_25eaf02f9f7cd23e8159104f75e" FOREIGN KEY ("featuredEmailContactId") REFERENCES "contact" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "owner"
        ADD CONSTRAINT "FK_79cecec1b41e0109f0b59301572" FOREIGN KEY ("personId") REFERENCES "person" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "owner"
        ADD CONSTRAINT "FK_a47fee049252057dcfaec0e2f0c" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "caller"
        ADD CONSTRAINT "FK_5af202179f18fa9a956d2a65c1a" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "flipper"
        ADD CONSTRAINT "FK_c24f1f24cf3eab2db55f501baf6" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "proposal"
        ADD CONSTRAINT "FK_5112162ab195b9dd5b77da54b44" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "proposal"
        ADD CONSTRAINT "FK_3ca2dc35f01a6b95841aa744265" FOREIGN KEY ("ownerId") REFERENCES "owner" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "proposal"
        ADD CONSTRAINT "FK_7fb3ca379aa24d018fa2f73ec6b" FOREIGN KEY ("authorId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD CONSTRAINT "FK_d41832400de343577945fb92a5f" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD CONSTRAINT "FK_943bfad047bdb6d2f67c92253cb" FOREIGN KEY ("queueId") REFERENCES "worksheet_queue" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "worksheet"
        ADD CONSTRAINT "FK_f7f612460e14a027386750806ba" FOREIGN KEY ("lastViewedById") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building"
        ADD CONSTRAINT "FK_81301cb0ea0fbff5bee80dc3b63" FOREIGN KEY ("featuredOwnerId") REFERENCES "owner" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building"
        ADD CONSTRAINT "FK_927c4402532a3a281d142a08c41" FOREIGN KEY ("assignedFlipperId") REFERENCES "flipper" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building_image"
        ADD CONSTRAINT "FK_f33926a566a7f91372b46d454e0" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
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
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_6de29c76427033d264bae72f54f"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_79a33ce0db1430efab0abe03347"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_926367aaeccbb7444558d73325c"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_ff835024f875afb0b9c089cb95c"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_5b6a0521da4f416bc997ad935cc"')
    await queryRunner.query('ALTER TABLE "building_offer_request" DROP CONSTRAINT "FK_417a1dd7d6e461f8cf09b3b76c4"')
    await queryRunner.query('ALTER TABLE "building_image" DROP CONSTRAINT "FK_f33926a566a7f91372b46d454e0"')
    await queryRunner.query('ALTER TABLE "building" DROP CONSTRAINT "FK_927c4402532a3a281d142a08c41"')
    await queryRunner.query('ALTER TABLE "building" DROP CONSTRAINT "FK_81301cb0ea0fbff5bee80dc3b63"')
    await queryRunner.query('ALTER TABLE "worksheet" DROP CONSTRAINT "FK_f7f612460e14a027386750806ba"')
    await queryRunner.query('ALTER TABLE "worksheet" DROP CONSTRAINT "FK_943bfad047bdb6d2f67c92253cb"')
    await queryRunner.query('ALTER TABLE "worksheet" DROP CONSTRAINT "FK_d41832400de343577945fb92a5f"')
    await queryRunner.query('ALTER TABLE "proposal" DROP CONSTRAINT "FK_7fb3ca379aa24d018fa2f73ec6b"')
    await queryRunner.query('ALTER TABLE "proposal" DROP CONSTRAINT "FK_3ca2dc35f01a6b95841aa744265"')
    await queryRunner.query('ALTER TABLE "proposal" DROP CONSTRAINT "FK_5112162ab195b9dd5b77da54b44"')
    await queryRunner.query('ALTER TABLE "flipper" DROP CONSTRAINT "FK_c24f1f24cf3eab2db55f501baf6"')
    await queryRunner.query('ALTER TABLE "caller" DROP CONSTRAINT "FK_5af202179f18fa9a956d2a65c1a"')
    await queryRunner.query('ALTER TABLE "owner" DROP CONSTRAINT "FK_a47fee049252057dcfaec0e2f0c"')
    await queryRunner.query('ALTER TABLE "owner" DROP CONSTRAINT "FK_79cecec1b41e0109f0b59301572"')
    await queryRunner.query('ALTER TABLE "person" DROP CONSTRAINT "FK_25eaf02f9f7cd23e8159104f75e"')
    await queryRunner.query('ALTER TABLE "person" DROP CONSTRAINT "FK_024709dd88626ea768a435db470"')
    await queryRunner.query('ALTER TABLE "person_contact" DROP CONSTRAINT "FK_b980ce9822fc63144b4c25aa6a6"')
    await queryRunner.query('ALTER TABLE "person_contact" DROP CONSTRAINT "FK_df8723423f0c007013d5b8574d3"')
    await queryRunner.query('DROP TABLE "building_offer_request"')
    await queryRunner.query('DROP TABLE "couchbase_document"')
    await queryRunner.query('DROP TABLE "domain_event"')
    await queryRunner.query('DROP TABLE "building_image"')
    await queryRunner.query('DROP TABLE "building"')
    await queryRunner.query('DROP TABLE "worksheet"')
    await queryRunner.query('DROP TABLE "worksheet_queue"')
    await queryRunner.query('DROP TABLE "proposal"')
    await queryRunner.query('DROP TABLE "flipper"')
    await queryRunner.query('DROP TABLE "user"')
    await queryRunner.query('DROP TABLE "caller"')
    await queryRunner.query('DROP TABLE "owner"')
    await queryRunner.query('DROP TABLE "person"')
    await queryRunner.query('DROP INDEX "public"."IDX_6efff9588a3f4f512e71d42332"')
    await queryRunner.query('DROP TABLE "person_contact"')
    await queryRunner.query('DROP TABLE "contact"')
  }
}
