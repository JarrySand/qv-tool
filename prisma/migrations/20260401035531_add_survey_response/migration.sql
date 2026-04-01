-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "voteId" TEXT,
    "q1Difficulties" TEXT,
    "q1Other" TEXT,
    "q2CreditSatisfaction" INTEGER,
    "q3QvPreference" INTEGER,
    "q4Feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_voteId_key" ON "SurveyResponse"("voteId");

-- CreateIndex
CREATE INDEX "SurveyResponse_eventId_idx" ON "SurveyResponse"("eventId");

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
