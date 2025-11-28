-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BannerConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL DEFAULT '#000000',
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL,
    "textAlign" TEXT NOT NULL DEFAULT 'center'
);
INSERT INTO "new_BannerConfig" ("backgroundColor", "id", "isEnabled", "message", "shop", "textColor", "updatedAt") SELECT "backgroundColor", "id", "isEnabled", "message", "shop", "textColor", "updatedAt" FROM "BannerConfig";
DROP TABLE "BannerConfig";
ALTER TABLE "new_BannerConfig" RENAME TO "BannerConfig";
CREATE UNIQUE INDEX "BannerConfig_shop_key" ON "BannerConfig"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
