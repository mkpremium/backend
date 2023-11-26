-- CreateTable
CREATE TABLE "CouchbaseDocument" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouchbaseDocument_pkey" PRIMARY KEY ("id")
);
