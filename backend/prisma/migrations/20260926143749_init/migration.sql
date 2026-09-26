-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Profile" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "targetTitles" TEXT NOT NULL DEFAULT '[]',
    "skills" TEXT NOT NULL DEFAULT '[]',
    "locations" TEXT NOT NULL DEFAULT '[]',
    "contractTypes" TEXT NOT NULL DEFAULT '[]',
    "remote" TEXT NOT NULL DEFAULT 'any',
    "salaryMin" INTEGER,
    "seniority" TEXT,
    "excludedKeywords" TEXT NOT NULL DEFAULT '[]',
    "excludedCompanies" TEXT NOT NULL DEFAULT '[]',
    "cvFileName" TEXT,
    "cvText" TEXT,
    "cvUpdatedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Search" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "progress" TEXT NOT NULL DEFAULT '{}',
    "foundCount" INTEGER NOT NULL DEFAULT 0,
    "newCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    CONSTRAINT "Search_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "contractType" TEXT,
    "remoteType" TEXT,
    "seniority" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "postedAt" DATETIME,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detailsFetched" BOOLEAN NOT NULL DEFAULT false,
    "titleVector" BLOB,
    "textVector" BLOB,
    "searchId" TEXT,
    CONSTRAINT "Offer_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "Search" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfferStatus" (
    "userId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("userId", "offerId"),
    CONSTRAINT "OfferStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferStatus_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfferMatch" (
    "userId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reasons" TEXT NOT NULL,
    "excluded" BOOLEAN NOT NULL DEFAULT false,
    "computedAt" DATETIME NOT NULL,

    PRIMARY KEY ("userId", "offerId"),
    CONSTRAINT "OfferMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferMatch_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Search_userId_createdAt_idx" ON "Search"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Search_status_idx" ON "Search"("status");

-- CreateIndex
CREATE INDEX "Offer_fingerprint_idx" ON "Offer"("fingerprint");

-- CreateIndex
CREATE INDEX "Offer_postedAt_idx" ON "Offer"("postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_source_externalId_key" ON "Offer"("source", "externalId");

-- CreateIndex
CREATE INDEX "OfferStatus_userId_status_idx" ON "OfferStatus"("userId", "status");

-- CreateIndex
CREATE INDEX "OfferMatch_userId_score_idx" ON "OfferMatch"("userId", "score");
