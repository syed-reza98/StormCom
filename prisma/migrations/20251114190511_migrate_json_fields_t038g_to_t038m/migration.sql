/*
  Warnings:

  - You are about to alter the column `changes` on the `audit_logs` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `variables` on the `email_templates` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `metaKeywords` on the `pages` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `metadata` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `countries` on the `shipping_zones` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `metadata` on the `sync_logs` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `events` on the `webhooks` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_audit_logs" ("action", "changes", "createdAt", "entityId", "entityType", "id", "ipAddress", "storeId", "userAgent", "userId") SELECT "action", "changes", "createdAt", "entityId", "entityType", "id", "ipAddress", "storeId", "userAgent", "userId" FROM "audit_logs";
DROP TABLE "audit_logs";
ALTER TABLE "new_audit_logs" RENAME TO "audit_logs";
CREATE INDEX "audit_logs_storeId_createdAt_idx" ON "audit_logs"("storeId", "createdAt");
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");
CREATE INDEX "audit_logs_entityType_entityId_createdAt_idx" ON "audit_logs"("entityType", "entityId", "createdAt");
CREATE TABLE "new_email_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "variables" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "email_templates_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_email_templates" ("createdAt", "handle", "htmlBody", "id", "isActive", "name", "storeId", "subject", "textBody", "updatedAt", "variables") SELECT "createdAt", "handle", "htmlBody", "id", "isActive", "name", "storeId", "subject", "textBody", "updatedAt", "variables" FROM "email_templates";
DROP TABLE "email_templates";
ALTER TABLE "new_email_templates" RENAME TO "email_templates";
CREATE INDEX "email_templates_storeId_isActive_idx" ON "email_templates"("storeId", "isActive");
CREATE UNIQUE INDEX "email_templates_storeId_handle_key" ON "email_templates"("storeId", "handle");
CREATE TABLE "new_pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "pages_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_pages" ("content", "createdAt", "deletedAt", "id", "isPublished", "metaDescription", "metaKeywords", "metaTitle", "publishedAt", "slug", "storeId", "title", "updatedAt") SELECT "content", "createdAt", "deletedAt", "id", "isPublished", "metaDescription", "metaKeywords", "metaTitle", "publishedAt", "slug", "storeId", "title", "updatedAt" FROM "pages";
DROP TABLE "pages";
ALTER TABLE "new_pages" RENAME TO "pages";
CREATE INDEX "pages_storeId_isPublished_idx" ON "pages"("storeId", "isPublished");
CREATE INDEX "pages_storeId_deletedAt_title_idx" ON "pages"("storeId", "deletedAt", "title");
CREATE UNIQUE INDEX "pages_storeId_slug_key" ON "pages"("storeId", "slug");
CREATE TABLE "new_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "method" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "gatewayPaymentId" TEXT,
    "gatewayCustomerId" TEXT,
    "gatewayChargeId" TEXT,
    "metadata" JSONB,
    "refundedAmount" REAL NOT NULL DEFAULT 0,
    "refundedAt" DATETIME,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payments_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_payments" ("amount", "createdAt", "currency", "failureCode", "failureMessage", "gateway", "gatewayChargeId", "gatewayCustomerId", "gatewayPaymentId", "id", "metadata", "method", "orderId", "refundedAmount", "refundedAt", "status", "storeId", "updatedAt") SELECT "amount", "createdAt", "currency", "failureCode", "failureMessage", "gateway", "gatewayChargeId", "gatewayCustomerId", "gatewayPaymentId", "id", "metadata", "method", "orderId", "refundedAmount", "refundedAt", "status", "storeId", "updatedAt" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
CREATE INDEX "payments_storeId_orderId_idx" ON "payments"("storeId", "orderId");
CREATE INDEX "payments_storeId_status_idx" ON "payments"("storeId", "status");
CREATE INDEX "payments_gatewayPaymentId_idx" ON "payments"("gatewayPaymentId");
CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");
CREATE INDEX "payments_gateway_status_createdAt_idx" ON "payments"("gateway", "status", "createdAt");
CREATE INDEX "payments_storeId_createdAt_idx" ON "payments"("storeId", "createdAt");
CREATE TABLE "new_shipping_zones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countries" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "shipping_zones_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_shipping_zones" ("countries", "createdAt", "id", "name", "storeId", "updatedAt") SELECT "countries", "createdAt", "id", "name", "storeId", "updatedAt" FROM "shipping_zones";
DROP TABLE "shipping_zones";
ALTER TABLE "new_shipping_zones" RENAME TO "shipping_zones";
CREATE INDEX "shipping_zones_storeId_idx" ON "shipping_zones"("storeId");
CREATE TABLE "new_sync_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sync_logs_configId_fkey" FOREIGN KEY ("configId") REFERENCES "external_platform_configs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sync_logs" ("action", "configId", "createdAt", "entityType", "errorMessage", "id", "metadata", "recordsFailed", "recordsProcessed", "status") SELECT "action", "configId", "createdAt", "entityType", "errorMessage", "id", "metadata", "recordsFailed", "recordsProcessed", "status" FROM "sync_logs";
DROP TABLE "sync_logs";
ALTER TABLE "new_sync_logs" RENAME TO "sync_logs";
CREATE INDEX "sync_logs_configId_createdAt_idx" ON "sync_logs"("configId", "createdAt");
CREATE INDEX "sync_logs_status_createdAt_idx" ON "sync_logs"("status", "createdAt");
CREATE TABLE "new_webhooks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" JSONB NOT NULL,
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastDeliveryAt" DATETIME,
    "lastDeliveryStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "webhooks_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_webhooks" ("createdAt", "events", "id", "isActive", "lastDeliveryAt", "lastDeliveryStatus", "secret", "storeId", "updatedAt", "url") SELECT "createdAt", "events", "id", "isActive", "lastDeliveryAt", "lastDeliveryStatus", "secret", "storeId", "updatedAt", "url" FROM "webhooks";
DROP TABLE "webhooks";
ALTER TABLE "new_webhooks" RENAME TO "webhooks";
CREATE INDEX "webhooks_storeId_isActive_idx" ON "webhooks"("storeId", "isActive");
CREATE INDEX "webhooks_isActive_lastDeliveryStatus_idx" ON "webhooks"("isActive", "lastDeliveryStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
