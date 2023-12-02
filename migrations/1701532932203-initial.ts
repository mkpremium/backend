import { MigrationInterface, QueryRunner } from 'typeorm'

export class Initial1701532932203 implements MigrationInterface {
  name = 'Initial1701532932203'

  public async up (queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(`CREATE TABLE "owner"
                             (
                                 "id"        uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                                 "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                                 CONSTRAINT "PK_8e86b6b9f94aece7d12d465dc0c" PRIMARY KEY ("id")
                             )`)
    await queryRunner.query(`CREATE TABLE "user"
                             (
                                 "id"        uuid              NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt" TIMESTAMP         NOT NULL DEFAULT now(),
                                 "updatedAt" TIMESTAMP         NOT NULL DEFAULT now(),
                                 "username"  character varying NOT NULL,
                                 "password"  character varying NOT NULL,
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
    await queryRunner.query(`CREATE TABLE "deal_proposal"
                             (
                                 "id"         uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                 "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
                                 "updatedAt"  TIMESTAMP NOT NULL DEFAULT now(),
                                 "buildingId" uuid,
                                 CONSTRAINT "PK_1d56c27d49f0667281273bc138a" PRIMARY KEY ("id")
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
    await queryRunner.query(`ALTER TABLE "building_image"
        ADD CONSTRAINT "FK_f33926a566a7f91372b46d454e0" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "flipper"
        ADD CONSTRAINT "FK_c24f1f24cf3eab2db55f501baf6" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "deal_proposal"
        ADD CONSTRAINT "FK_d323f2f1139c97d48106d95db84" FOREIGN KEY ("buildingId") REFERENCES "building" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building"
        ADD CONSTRAINT "FK_81301cb0ea0fbff5bee80dc3b63" FOREIGN KEY ("featuredOwnerId") REFERENCES "owner" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await queryRunner.query(`ALTER TABLE "building"
        ADD CONSTRAINT "FK_927c4402532a3a281d142a08c41" FOREIGN KEY ("assignedFlipperId") REFERENCES "flipper" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  public async down (queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "building" DROP CONSTRAINT "FK_927c4402532a3a281d142a08c41"`)
    await queryRunner.query(`ALTER TABLE "building" DROP CONSTRAINT "FK_81301cb0ea0fbff5bee80dc3b63"`)
    await queryRunner.query(`ALTER TABLE "deal_proposal" DROP CONSTRAINT "FK_d323f2f1139c97d48106d95db84"`)
    await queryRunner.query(`ALTER TABLE "flipper" DROP CONSTRAINT "FK_c24f1f24cf3eab2db55f501baf6"`)
    await queryRunner.query(`ALTER TABLE "building_image" DROP CONSTRAINT "FK_f33926a566a7f91372b46d454e0"`)
    await queryRunner.query(`DROP TABLE "couchbase_document"`)
    await queryRunner.query(`DROP TABLE "domain_event"`)
    await queryRunner.query(`DROP TABLE "building"`)
    await queryRunner.query(`DROP TABLE "deal_proposal"`)
    await queryRunner.query(`DROP TABLE "flipper"`)
    await queryRunner.query(`DROP TABLE "user"`)
    await queryRunner.query(`DROP TABLE "owner"`)
    await queryRunner.query(`DROP TABLE "building_image"`)
  }

}
