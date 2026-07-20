CREATE TABLE "faceit_championships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournament" TEXT NOT NULL,
    "championshipId" TEXT NOT NULL,
    "faceitUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT,
    "gameId" TEXT,
    "startsAt" DATETIME,
    "teamsJson" TEXT NOT NULL DEFAULT '[]',
    "matchesJson" TEXT NOT NULL DEFAULT '[]',
    "resultsJson" TEXT NOT NULL DEFAULT '[]',
    "syncedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "faceit_championships_tournament_key" ON "faceit_championships"("tournament");
CREATE UNIQUE INDEX "faceit_championships_championshipId_key" ON "faceit_championships"("championshipId");
