BEGIN IMMEDIATE;

-- Abort without changing the schema if the deployed window already admitted
-- conflicting active registrations. An administrator must reject the duplicate
-- registration before retrying this migration; choosing a winner silently would
-- alter tournament state.
CREATE UNIQUE INDEX "registration_active_faceit_claim_migration_guard"
ON "registrations"(lower(trim("tournament")), lower(trim("faceitTeamId")))
WHERE "status" <> 'REJECTED' AND "faceitTeamId" IS NOT NULL;

CREATE UNIQUE INDEX "registration_active_team_name_claim_migration_guard"
ON "registrations"(lower(trim("tournament")), lower(trim("teamNameNormalized")))
WHERE "status" <> 'REJECTED';

ALTER TABLE "registrations" ADD COLUMN "teamNameClaimKey" TEXT;

UPDATE "registrations"
SET
  "claimKey" = CASE
    WHEN "status" = 'REJECTED' THEN NULL
    WHEN "faceitTeamId" IS NOT NULL THEN lower(trim("tournament")) || ':' || lower(trim("faceitTeamId"))
    ELSE lower(trim("tournament")) || ':name:' || lower(trim("teamNameNormalized"))
  END,
  "teamNameClaimKey" = CASE
    WHEN "status" = 'REJECTED' THEN NULL
    ELSE lower(trim("tournament")) || ':name:' || lower(trim("teamNameNormalized"))
  END;

CREATE UNIQUE INDEX "registrations_teamNameClaimKey_key" ON "registrations"("teamNameClaimKey");

DROP INDEX "registration_active_faceit_claim_migration_guard";
DROP INDEX "registration_active_team_name_claim_migration_guard";

COMMIT;
