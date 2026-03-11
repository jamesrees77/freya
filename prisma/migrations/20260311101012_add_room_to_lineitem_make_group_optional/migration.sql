-- Step 1: Add roomId as nullable first
ALTER TABLE "LineItem" ADD COLUMN "roomId" TEXT;

-- Step 2: Backfill roomId from the LineItemGroup's roomId
UPDATE "LineItem"
SET "roomId" = "LineItemGroup"."roomId"
FROM "LineItemGroup"
WHERE "LineItem"."groupId" = "LineItemGroup"."id";

-- Step 3: Make roomId NOT NULL now that all rows have a value
ALTER TABLE "LineItem" ALTER COLUMN "roomId" SET NOT NULL;

-- Step 4: Make groupId nullable
ALTER TABLE "LineItem" ALTER COLUMN "groupId" DROP NOT NULL;

-- Step 5: Create index
CREATE INDEX "LineItem_roomId_sortOrder_idx" ON "LineItem"("roomId", "sortOrder");

-- Step 6: Add foreign key
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
