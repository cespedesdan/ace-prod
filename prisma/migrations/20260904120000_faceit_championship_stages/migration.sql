ALTER TABLE "faceit_championships" ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'SWISS';
DROP INDEX "faceit_championships_tournament_key";
CREATE UNIQUE INDEX "faceit_championships_tournament_stage_key" ON "faceit_championships"("tournament", "stage");
