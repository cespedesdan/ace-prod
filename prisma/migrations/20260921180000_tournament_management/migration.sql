ALTER TABLE "tournaments" ADD COLUMN "slug" TEXT NOT NULL DEFAULT '';
ALTER TABLE "tournaments" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "tournaments" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "tournaments" ADD COLUMN "format" TEXT NOT NULL DEFAULT 'SWISS_SINGLE_ELIMINATION';
ALTER TABLE "tournaments" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "tournaments" ADD COLUMN "teamLimit" INTEGER NOT NULL DEFAULT 16;
ALTER TABLE "tournaments" ADD COLUMN "prizePoolCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tournaments" ADD COLUMN "registrationOpen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tournaments" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tournaments" ADD COLUMN "publishedInHallOfFame" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tournaments" ADD COLUMN "champion" TEXT;
ALTER TABLE "tournaments" ADD COLUMN "runnerUp" TEXT;
ALTER TABLE "tournaments" ADD COLUMN "finalSnapshotJson" TEXT;
ALTER TABLE "tournaments" ADD COLUMN "closedAt" DATETIME;
ALTER TABLE "tournaments" ADD COLUMN "reopenedAt" DATETIME;
ALTER TABLE "tournaments" ADD COLUMN "lastActionBy" TEXT;

UPDATE "tournaments"
SET "slug" = lower(hex(randomblob(8)))
WHERE "slug" = '';

CREATE UNIQUE INDEX "tournaments_slug_key" ON "tournaments"("slug");

INSERT OR IGNORE INTO "tournaments" (
  "id", "name", "slug", "description", "logoUrl", "format", "status",
  "teamLimit", "prizePoolCents", "registrationOpen", "published",
  "publishedInHallOfFame", "startDate", "endDate", "createdAt", "updatedAt"
) VALUES (
  'copa-ace-10',
  'Copa Ace 10',
  'copa-ace-10',
  'A décima edição reúne 16 equipes em uma fase suíça MD1, seguida por playoffs MD3.',
  '/hall-of-fame/logos/copa-ace-10.webp',
  'SWISS_SINGLE_ELIMINATION',
  'ONGOING',
  16,
  150000,
  false,
  true,
  false,
  '2026-08-20 22:00:00+00:00',
  '2026-09-07 03:00:00+00:00',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
