-- This migration adds database triggers for soft delete validation
-- These triggers ensure that soft deleted records cannot be accidentally modified
-- and that deletedAt timestamps are properly maintained across multi-tenant operations

-- Soft delete validation trigger for Store table
-- Prevents modification of soft-deleted stores
CREATE TRIGGER IF NOT EXISTS prevent_store_modification_after_soft_delete
BEFORE UPDATE ON Store
FOR EACH ROW
WHEN OLD.deletedAt IS NOT NULL AND NEW.deletedAt IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Cannot modify soft-deleted store. Restore it first by setting deletedAt to NULL.');
END;

-- Soft delete validation trigger for Product table
-- Prevents modification of soft-deleted products
CREATE TRIGGER IF NOT EXISTS prevent_product_modification_after_soft_delete
BEFORE UPDATE ON Product
FOR EACH ROW
WHEN OLD.deletedAt IS NOT NULL AND NEW.deletedAt IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Cannot modify soft-deleted product. Restore it first by setting deletedAt to NULL.');
END;

-- Soft delete validation trigger for Customer table
-- Prevents modification of soft-deleted customers
CREATE TRIGGER IF NOT EXISTS prevent_customer_modification_after_soft_delete
BEFORE UPDATE ON Customer
FOR EACH ROW
WHEN OLD.deletedAt IS NOT NULL AND NEW.deletedAt IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Cannot modify soft-deleted customer. Restore it first by setting deletedAt to NULL.');
END;

-- Soft delete validation trigger for Order table
-- Prevents modification of soft-deleted orders
CREATE TRIGGER IF NOT EXISTS prevent_order_modification_after_soft_delete
BEFORE UPDATE ON Order
FOR EACH ROW
WHEN OLD.deletedAt IS NOT NULL AND NEW.deletedAt IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Cannot modify soft-deleted order. Restore it first by setting deletedAt to NULL.');
END;

-- Soft delete validation trigger for Category table
-- Prevents modification of soft-deleted categories
CREATE TRIGGER IF NOT EXISTS prevent_category_modification_after_soft_delete
BEFORE UPDATE ON Category
FOR EACH ROW
WHEN OLD.deletedAt IS NOT NULL AND NEW.deletedAt IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Cannot modify soft-deleted category. Restore it first by setting deletedAt to NULL.');
END;

-- Soft delete validation trigger for Brand table
-- Prevents modification of soft-deleted brands
CREATE TRIGGER IF NOT EXISTS prevent_brand_modification_after_soft_delete
BEFORE UPDATE ON Brand
FOR EACH ROW
WHEN OLD.deletedAt IS NOT NULL AND NEW.deletedAt IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Cannot modify soft-deleted brand. Restore it first by setting deletedAt to NULL.');
END;

-- Soft delete validation trigger for Coupon table
-- Prevents modification of soft-deleted coupons
CREATE TRIGGER IF NOT EXISTS prevent_coupon_modification_after_soft_delete
BEFORE UPDATE ON Coupon
FOR EACH ROW
WHEN OLD.deletedAt IS NOT NULL AND NEW.deletedAt IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Cannot modify soft-deleted coupon. Restore it first by setting deletedAt to NULL.');
END;

-- Soft delete validation trigger for FlashSale table
-- Prevents modification of soft-deleted flash sales
CREATE TRIGGER IF NOT EXISTS prevent_flashsale_modification_after_soft_delete
BEFORE UPDATE ON FlashSale
FOR EACH ROW
WHEN OLD.deletedAt IS NOT NULL AND NEW.deletedAt IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Cannot modify soft-deleted flash sale. Restore it first by setting deletedAt to NULL.');
END;

-- Auto-set deletedAt timestamp when soft deleting Store
CREATE TRIGGER IF NOT EXISTS auto_set_store_deleted_at
BEFORE UPDATE ON Store
FOR EACH ROW
WHEN OLD.deletedAt IS NULL AND NEW.deletedAt IS NOT NULL
BEGIN
  UPDATE Store SET deletedAt = datetime('now') WHERE id = NEW.id;
END;

-- Auto-set deletedAt timestamp when soft deleting Product
CREATE TRIGGER IF NOT EXISTS auto_set_product_deleted_at
BEFORE UPDATE ON Product
FOR EACH ROW
WHEN OLD.deletedAt IS NULL AND NEW.deletedAt IS NOT NULL
BEGIN
  UPDATE Product SET deletedAt = datetime('now') WHERE id = NEW.id;
END;

-- Auto-set deletedAt timestamp when soft deleting Customer
CREATE TRIGGER IF NOT EXISTS auto_set_customer_deleted_at
BEFORE UPDATE ON Customer
FOR EACH ROW
WHEN OLD.deletedAt IS NULL AND NEW.deletedAt IS NOT NULL
BEGIN
  UPDATE Customer SET deletedAt = datetime('now') WHERE id = NEW.id;
END;

-- Auto-set deletedAt timestamp when soft deleting Order
CREATE TRIGGER IF NOT EXISTS auto_set_order_deleted_at
BEFORE UPDATE ON Order
FOR EACH ROW
WHEN OLD.deletedAt IS NULL AND NEW.deletedAt IS NOT NULL
BEGIN
  UPDATE Order SET deletedAt = datetime('now') WHERE id = NEW.id;
END;

-- Cascade soft delete from Store to related entities
-- When a store is soft deleted, all its products, orders, customers should also be soft deleted
CREATE TRIGGER IF NOT EXISTS cascade_soft_delete_store_products
AFTER UPDATE ON Store
FOR EACH ROW
WHEN OLD.deletedAt IS NULL AND NEW.deletedAt IS NOT NULL
BEGIN
  UPDATE Product SET deletedAt = NEW.deletedAt WHERE storeId = NEW.id AND deletedAt IS NULL;
  UPDATE Customer SET deletedAt = NEW.deletedAt WHERE storeId = NEW.id AND deletedAt IS NULL;
  UPDATE Order SET deletedAt = NEW.deletedAt WHERE storeId = NEW.id AND deletedAt IS NULL;
  UPDATE Category SET deletedAt = NEW.deletedAt WHERE storeId = NEW.id AND deletedAt IS NULL;
  UPDATE Brand SET deletedAt = NEW.deletedAt WHERE storeId = NEW.id AND deletedAt IS NULL;
  UPDATE Coupon SET deletedAt = NEW.deletedAt WHERE storeId = NEW.id AND deletedAt IS NULL;
  UPDATE FlashSale SET deletedAt = NEW.deletedAt WHERE storeId = NEW.id AND deletedAt IS NULL;
END;

-- Restore related entities when Store is restored from soft delete
CREATE TRIGGER IF NOT EXISTS cascade_restore_store_entities
AFTER UPDATE ON Store
FOR EACH ROW
WHEN OLD.deletedAt IS NOT NULL AND NEW.deletedAt IS NULL
BEGIN
  -- Note: We don't automatically restore child entities when parent is restored
  -- This is intentional to prevent accidental data restoration
  -- Child entities must be manually restored by admin
  SELECT 1; -- No-op, but keeps trigger valid
END;
