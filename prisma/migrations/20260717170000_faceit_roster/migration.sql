-- AlterTable
ALTER TABLE "registrations" ADD COLUMN "faceitTeamId" TEXT;
ALTER TABLE "registrations" ADD COLUMN "faceitTeamNickname" TEXT;
ALTER TABLE "registrations" ADD COLUMN "faceitTeamAvatarUrl" TEXT;
ALTER TABLE "registrations" ADD COLUMN "faceitLastSyncedAt" DATETIME;

-- CreateTable
CREATE TABLE "registration_players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registrationId" TEXT NOT NULL,
    "faceitPlayerId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "country" TEXT,
    "skillLevel" INTEGER,
    "membershipType" TEXT,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "faceitUrl" TEXT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "registration_players_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "registrations_faceitTeamId_key" ON "registrations"("faceitTeamId");
CREATE UNIQUE INDEX "registration_players_registrationId_faceitPlayerId_key" ON "registration_players"("registrationId", "faceitPlayerId");
CREATE INDEX "registration_players_registrationId_idx" ON "registration_players"("registrationId");
