BEGIN;

CREATE UNIQUE INDEX "SurveySession_anonymousSessionId_surveyVersion_key"
ON "SurveySession"("anonymousSessionId", "surveyVersion");

DROP INDEX "SurveySession_anonymousSessionId_key";

ALTER TABLE "ProductVote" ADD COLUMN "ballotKey" TEXT;
CREATE UNIQUE INDEX "ProductVote_ballotKey_key" ON "ProductVote"("ballotKey");

COMMIT;
