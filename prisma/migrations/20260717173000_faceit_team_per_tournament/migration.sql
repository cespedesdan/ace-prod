-- A mesma equipe pode participar de edições diferentes, mas apenas uma vez por torneio.
DROP INDEX "registrations_faceitTeamId_key";
CREATE UNIQUE INDEX "registrations_tournament_faceitTeamId_key"
ON "registrations"("tournament", "faceitTeamId");
