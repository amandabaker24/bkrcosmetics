ALTER TABLE "WaitlistSubscriber"
ADD COLUMN "welcomeQueuedAt" TIMESTAMP(3),
ADD COLUMN "welcomeAttemptedAt" TIMESTAMP(3),
ADD COLUMN "welcomeSentAt" TIMESTAMP(3);

CREATE INDEX "WaitlistSubscriber_welcomeQueuedAt_idx" ON "WaitlistSubscriber"("welcomeQueuedAt");
