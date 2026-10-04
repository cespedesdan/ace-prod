ALTER TABLE "faceit_championships" ADD COLUMN "lastWebhookReceivedAt" DATETIME;
ALTER TABLE "faceit_championships" ADD COLUMN "lastWebhookEvent" TEXT;
ALTER TABLE "faceit_championships" ADD COLUMN "webhookGeneration" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "faceit_championships" ADD COLUMN "lastWebhookDigest" TEXT;
