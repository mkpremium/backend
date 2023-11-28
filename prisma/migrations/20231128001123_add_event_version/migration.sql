/*
  Warnings:

  - Added the required column `version` to the `DomainEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DomainEvent" ADD COLUMN     "version" TEXT NOT NULL;
