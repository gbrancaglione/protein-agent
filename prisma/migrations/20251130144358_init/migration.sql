-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "target" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protein_entries" (
    "id" SERIAL NOT NULL,
    "proteinGrams" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "protein_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "protein_entries_timestamp_idx" ON "protein_entries"("timestamp");

-- CreateIndex
CREATE INDEX "protein_entries_userId_idx" ON "protein_entries"("userId");

-- AddForeignKey
ALTER TABLE "protein_entries" ADD CONSTRAINT "protein_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
