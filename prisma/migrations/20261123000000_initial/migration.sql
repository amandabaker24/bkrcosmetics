-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "VoteSource" AS ENUM ('SURVEY', 'STANDALONE');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN');

-- CreateTable
CREATE TABLE "SurveySession" (
    "id" TEXT NOT NULL,
    "anonymousSessionId" TEXT NOT NULL,
    "status" "SurveyStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL,
    "campaign" TEXT,
    "surveyVersion" TEXT NOT NULL,

    CONSTRAINT "SurveySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "surveySessionId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "answerJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductConcept" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "proposedPrice" DECIMAL(7,2) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVote" (
    "id" TEXT NOT NULL,
    "productConceptId" TEXT NOT NULL,
    "anonymousSessionId" TEXT NOT NULL,
    "surveySessionId" TEXT,
    "source" "VoteSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistSubscriber" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "email" TEXT NOT NULL,
    "marketingConsent" BOOLEAN NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "consentTimestamp" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "campaign" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "confirmationHash" TEXT,
    "confirmationExpiry" TIMESTAMP(3),
    "unsubscribeHash" TEXT NOT NULL,

    CONSTRAINT "WaitlistSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFeedback" (
    "id" TEXT NOT NULL,
    "productConceptId" TEXT NOT NULL,
    "anonymousSessionId" TEXT NOT NULL,
    "purchaseIntent" TEXT NOT NULL,
    "expectedPrice" DECIMAL(7,2),
    "feedback" TEXT NOT NULL,
    "purchaseBarrier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "SurveySession_anonymousSessionId_key" ON "SurveySession"("anonymousSessionId");

-- CreateIndex
CREATE INDEX "SurveySession_status_completedAt_idx" ON "SurveySession"("status", "completedAt");

-- CreateIndex
CREATE INDEX "SurveySession_startedAt_source_idx" ON "SurveySession"("startedAt", "source");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_surveySessionId_questionKey_key" ON "SurveyResponse"("surveySessionId", "questionKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProductConcept_slug_key" ON "ProductConcept"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVote_surveySessionId_key" ON "ProductVote"("surveySessionId");

-- CreateIndex
CREATE INDEX "ProductVote_source_createdAt_idx" ON "ProductVote"("source", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVote_productConceptId_anonymousSessionId_source_key" ON "ProductVote"("productConceptId", "anonymousSessionId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistSubscriber_email_key" ON "WaitlistSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistSubscriber_confirmationHash_key" ON "WaitlistSubscriber"("confirmationHash");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistSubscriber_unsubscribeHash_key" ON "WaitlistSubscriber"("unsubscribeHash");

-- CreateIndex
CREATE INDEX "WaitlistSubscriber_createdAt_source_idx" ON "WaitlistSubscriber"("createdAt", "source");

-- CreateIndex
CREATE INDEX "ProductFeedback_createdAt_idx" ON "ProductFeedback"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductFeedback_productConceptId_anonymousSessionId_key" ON "ProductFeedback"("productConceptId", "anonymousSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminSession_userId_idx" ON "AdminSession"("userId");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveySessionId_fkey" FOREIGN KEY ("surveySessionId") REFERENCES "SurveySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVote" ADD CONSTRAINT "ProductVote_productConceptId_fkey" FOREIGN KEY ("productConceptId") REFERENCES "ProductConcept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVote" ADD CONSTRAINT "ProductVote_surveySessionId_fkey" FOREIGN KEY ("surveySessionId") REFERENCES "SurveySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFeedback" ADD CONSTRAINT "ProductFeedback_productConceptId_fkey" FOREIGN KEY ("productConceptId") REFERENCES "ProductConcept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

