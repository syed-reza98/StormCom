/*
  Warnings:

  - You are about to alter the column `values` on the `product_attributes` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `options` on the `product_variants` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `images` on the `products` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `metaKeywords` on the `products` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `images` on the `reviews` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_product_attributes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_product_attributes" ("createdAt", "id", "name", "updatedAt", "values") SELECT "createdAt", "id", "name", "updatedAt", "values" FROM "product_attributes";
DROP TABLE "product_attributes";
ALTER TABLE "new_product_attributes" RENAME TO "product_attributes";
CREATE INDEX "product_attributes_name_idx" ON "product_attributes"("name");
CREATE TABLE "new_product_variants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "price" REAL,
    "compareAtPrice" REAL,
    "inventoryQty" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "weight" REAL,
    "image" TEXT,
    "options" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_product_variants" ("barcode", "compareAtPrice", "createdAt", "id", "image", "inventoryQty", "isDefault", "lowStockThreshold", "name", "options", "price", "productId", "sku", "updatedAt", "weight") SELECT "barcode", "compareAtPrice", "createdAt", "id", "image", "inventoryQty", "isDefault", "lowStockThreshold", "name", "options", "price", "productId", "sku", "updatedAt", "weight" FROM "product_variants";
DROP TABLE "product_variants";
ALTER TABLE "new_product_variants" RENAME TO "product_variants";
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");
CREATE INDEX "product_variants_productId_isDefault_idx" ON "product_variants"("productId", "isDefault");
CREATE INDEX "product_variants_productId_inventoryQty_idx" ON "product_variants"("productId", "inventoryQty");
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "price" REAL NOT NULL,
    "compareAtPrice" REAL,
    "costPrice" REAL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "trackInventory" BOOLEAN NOT NULL DEFAULT true,
    "inventoryQty" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "inventoryStatus" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "weight" REAL,
    "length" REAL,
    "width" REAL,
    "height" REAL,
    "categoryId" TEXT,
    "brandId" TEXT,
    "images" JSONB NOT NULL,
    "thumbnailUrl" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "products_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_products" ("barcode", "brandId", "categoryId", "compareAtPrice", "costPrice", "createdAt", "deletedAt", "description", "height", "id", "images", "inventoryQty", "inventoryStatus", "isFeatured", "isPublished", "length", "lowStockThreshold", "metaDescription", "metaKeywords", "metaTitle", "name", "price", "publishedAt", "shortDescription", "sku", "slug", "storeId", "thumbnailUrl", "trackInventory", "updatedAt", "weight", "width") SELECT "barcode", "brandId", "categoryId", "compareAtPrice", "costPrice", "createdAt", "deletedAt", "description", "height", "id", "images", "inventoryQty", "inventoryStatus", "isFeatured", "isPublished", "length", "lowStockThreshold", "metaDescription", "metaKeywords", "metaTitle", "name", "price", "publishedAt", "shortDescription", "sku", "slug", "storeId", "thumbnailUrl", "trackInventory", "updatedAt", "weight", "width" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE INDEX "products_storeId_categoryId_idx" ON "products"("storeId", "categoryId");
CREATE INDEX "products_storeId_brandId_idx" ON "products"("storeId", "brandId");
CREATE INDEX "products_storeId_isPublished_idx" ON "products"("storeId", "isPublished");
CREATE INDEX "products_storeId_isFeatured_idx" ON "products"("storeId", "isFeatured");
CREATE INDEX "products_storeId_isPublished_createdAt_idx" ON "products"("storeId", "isPublished", "createdAt");
CREATE INDEX "products_storeId_inventoryStatus_idx" ON "products"("storeId", "inventoryStatus");
CREATE INDEX "products_categoryId_isPublished_idx" ON "products"("categoryId", "isPublished");
CREATE INDEX "products_brandId_isPublished_idx" ON "products"("brandId", "isPublished");
CREATE UNIQUE INDEX "products_storeId_sku_key" ON "products"("storeId", "sku");
CREATE UNIQUE INDEX "products_storeId_slug_key" ON "products"("storeId", "slug");
CREATE TABLE "new_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "customerId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT NOT NULL,
    "images" JSONB NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "reviews_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_reviews" ("approvedAt", "comment", "createdAt", "customerId", "deletedAt", "id", "images", "isApproved", "isVerifiedPurchase", "productId", "rating", "storeId", "title", "updatedAt", "userId") SELECT "approvedAt", "comment", "createdAt", "customerId", "deletedAt", "id", "images", "isApproved", "isVerifiedPurchase", "productId", "rating", "storeId", "title", "updatedAt", "userId" FROM "reviews";
DROP TABLE "reviews";
ALTER TABLE "new_reviews" RENAME TO "reviews";
CREATE INDEX "reviews_storeId_productId_idx" ON "reviews"("storeId", "productId");
CREATE INDEX "reviews_storeId_isApproved_idx" ON "reviews"("storeId", "isApproved");
CREATE INDEX "reviews_productId_isApproved_createdAt_idx" ON "reviews"("productId", "isApproved", "createdAt");
CREATE INDEX "reviews_customerId_createdAt_idx" ON "reviews"("customerId", "createdAt");
CREATE INDEX "reviews_userId_createdAt_idx" ON "reviews"("userId", "createdAt");
CREATE INDEX "reviews_productId_isVerifiedPurchase_isApproved_idx" ON "reviews"("productId", "isVerifiedPurchase", "isApproved");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
