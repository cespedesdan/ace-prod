ALTER TABLE "registrations" ADD COLUMN "claimKey" TEXT;

UPDATE "registrations"
SET "claimKey" = CASE
  WHEN "status" = 'REJECTED' THEN NULL
  WHEN "faceitTeamId" IS NOT NULL THEN lower("tournament") || ':' || lower("faceitTeamId")
  ELSE lower("tournament") || ':name:' || "teamNameNormalized"
END;

DROP INDEX "registrations_tournament_teamNameNormalized_key";
DROP INDEX "registrations_tournament_faceitTeamId_key";

CREATE UNIQUE INDEX "registrations_claimKey_key" ON "registrations"("claimKey");
