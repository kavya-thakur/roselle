-- DropIndex
DROP INDEX "Event_pageId_createdAt_idx";

-- CreateIndex
CREATE INDEX "Event_pageId_type_createdAt_idx" ON "Event"("pageId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Token_expiresAt_idx" ON "Token"("expiresAt");

