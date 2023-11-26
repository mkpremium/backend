-- CreateTable
CREATE TABLE "DomainEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" JSONB NOT NULL,

    CONSTRAINT "DomainEvent_pkey" PRIMARY KEY ("id")
);
