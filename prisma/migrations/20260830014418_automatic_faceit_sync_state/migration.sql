-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_faceit_championships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournament" TEXT NOT NULL,
    "championshipId" TEXT NOT NULL,
    "faceitUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT,
    "gameId" TEXT,
    "format" TEXT,
    "seedingStrategy" TEXT,
    "totalRounds" INTEGER,
    "startsAt" DATETIME,
    "teamsJson" TEXT NOT NULL DEFAULT '[]',
    "matchesJson" TEXT NOT NULL DEFAULT '[]',
    "resultsJson" TEXT NOT NULL DEFAULT '[]',
    "syncedAt" DATETIME NOT NULL,
    "autoSyncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "nextAutoSyncAt" DATETIME,
    "lastAutoSyncAt" DATETIME,
    "lastAutoSyncAttemptAt" DATETIME,
    "lastAutoSyncFailureAt" DATETIME,
    "lastAutoSyncError" TEXT,
    "consecutiveAutoSyncFailures" INTEGER NOT NULL DEFAULT 0,
    "autoSyncLeaseUntil" DATETIME,
    "autoSyncLeaseToken" TEXT,
    "terminalStatusObservedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_faceit_championships" ("championshipId", "createdAt", "faceitUrl", "format", "gameId", "id", "matchesJson", "name", "resultsJson", "seedingStrategy", "startsAt", "status", "syncedAt", "teamsJson", "totalRounds", "tournament", "updatedAt") SELECT "championshipId", "createdAt", "faceitUrl", "format", "gameId", "id", "matchesJson", "name", "resultsJson", "seedingStrategy", "startsAt", "status", "syncedAt", "teamsJson", "totalRounds", "tournament", "updatedAt" FROM "faceit_championships";
DROP TABLE "faceit_championships";
ALTER TABLE "new_faceit_championships" RENAME TO "faceit_championships";
CREATE UNIQUE INDEX "faceit_championships_tournament_key" ON "faceit_championships"("tournament");
CREATE UNIQUE INDEX "faceit_championships_championshipId_key" ON "faceit_championships"("championshipId");
CREATE INDEX "faceit_championships_autoSyncEnabled_nextAutoSyncAt_idx" ON "faceit_championships"("autoSyncEnabled", "nextAutoSyncAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
