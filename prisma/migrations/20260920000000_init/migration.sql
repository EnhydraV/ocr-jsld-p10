-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "conversation_topic" AS ENUM ('reservation', 'payment', 'account', 'other');

-- CreateEnum
CREATE TYPE "conversation_status" AS ENUM ('waiting', 'open', 'resolved');

-- CreateEnum
CREATE TYPE "message_author" AS ENUM ('customer', 'advisor', 'system');

-- CreateTable
CREATE TABLE "conversation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" TEXT NOT NULL,
    "advisor_id" TEXT,
    "reservation_ref" TEXT,
    "topic" "conversation_topic" NOT NULL DEFAULT 'other',
    "status" "conversation_status" NOT NULL DEFAULT 'waiting',
    "last_seq" INTEGER NOT NULL DEFAULT 0,
    "opened_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "seq" INTEGER NOT NULL,
    "author_type" "message_author" NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMPTZ,
    "read_at" TIMESTAMPTZ,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversation_customer_id_opened_at_idx" ON "conversation"("customer_id", "opened_at" DESC);

-- CreateIndex
CREATE INDEX "conversation_status_opened_at_idx" ON "conversation"("status", "opened_at");

-- CreateIndex
CREATE UNIQUE INDEX "message_conversation_id_seq_key" ON "message"("conversation_id", "seq");

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Contraintes que Prisma ne modélise pas, ajoutées à la main dans la migration.
ALTER TABLE "message" ADD CONSTRAINT "message_body_length_chk" CHECK (length("body") BETWEEN 1 AND 4000);
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_resolved_chk" CHECK ("status" <> 'resolved' OR "resolved_at" IS NOT NULL);
