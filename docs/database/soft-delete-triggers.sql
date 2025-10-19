-- ============================================================================
-- SOFT DELETE CASCADE TRIGGERS FOR POSTGRESQL
-- ============================================================================
-- 
-- Purpose: Automatically cascade soft deletes (deletedAt) from parent to child entities
-- Usage: Apply these triggers when deploying to PostgreSQL production environment
-- Note: SQLite does not support these triggers; soft delete logic is enforced in application layer
--
-- WARNING: These triggers should be applied carefully and tested in staging first
-- ============================================================================

-- 1. Product → ProductVariant cascade
-- When a Product is soft-deleted, all its variants are also soft-deleted
CREATE OR REPLACE FUNCTION soft_delete_product_variants()
RETURNS TRIGGER AS $$
BEGIN
  -- Only cascade when product is being soft-deleted (not already deleted)
  IF NEW."deletedAt" IS NOT NULL AND OLD."deletedAt" IS NULL THEN
    UPDATE "ProductVariant"
    SET "deletedAt" = NEW."deletedAt", "updatedAt" = NOW()
    WHERE "productId" = NEW.id AND "deletedAt" IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_soft_delete_product_variants
AFTER UPDATE ON "Product"
FOR EACH ROW
EXECUTE FUNCTION soft_delete_product_variants();

-- 2. Category → Product cascade
-- When a Category is soft-deleted, all products in that category are also soft-deleted
CREATE OR REPLACE FUNCTION soft_delete_category_products()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."deletedAt" IS NOT NULL AND OLD."deletedAt" IS NULL THEN
    UPDATE "Product"
    SET "deletedAt" = NEW."deletedAt", "updatedAt" = NOW()
    WHERE "categoryId" = NEW.id AND "deletedAt" IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_soft_delete_category_products
AFTER UPDATE ON "Category"
FOR EACH ROW
EXECUTE FUNCTION soft_delete_category_products();

-- 3. Store → All child entities cascade
-- When a Store is soft-deleted, all its data is also soft-deleted
-- Note: This is a critical operation and should be used with extreme caution
CREATE OR REPLACE FUNCTION soft_delete_store_data()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."deletedAt" IS NOT NULL AND OLD."deletedAt" IS NULL THEN
    -- Soft delete products (which will cascade to variants via trigger above)
    UPDATE "Product"
    SET "deletedAt" = NEW."deletedAt", "updatedAt" = NOW()
    WHERE "storeId" = NEW.id AND "deletedAt" IS NULL;

    -- Soft delete categories
    UPDATE "Category"
    SET "deletedAt" = NEW."deletedAt", "updatedAt" = NOW()
    WHERE "storeId" = NEW.id AND "deletedAt" IS NULL;

    -- Soft delete brands
    UPDATE "Brand"
    SET "deletedAt" = NEW."deletedAt", "updatedAt" = NOW()
    WHERE "storeId" = NEW.id AND "deletedAt" IS NULL;

    -- Soft delete customers
    UPDATE "Customer"
    SET "deletedAt" = NEW."deletedAt", "updatedAt" = NOW()
    WHERE "storeId" = NEW.id AND "deletedAt" IS NULL;

    -- Soft delete orders
    UPDATE "Order"
    SET "deletedAt" = NEW."deletedAt", "updatedAt" = NOW()
    WHERE "storeId" = NEW.id AND "deletedAt" IS NULL;

    -- Add other store-scoped entities as needed
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_soft_delete_store_data
AFTER UPDATE ON "Store"
FOR EACH ROW
EXECUTE FUNCTION soft_delete_store_data();

-- 4. Order → OrderItem cascade
-- When an Order is soft-deleted, all its items are also soft-deleted
CREATE OR REPLACE FUNCTION soft_delete_order_items()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."deletedAt" IS NOT NULL AND OLD."deletedAt" IS NULL THEN
    UPDATE "OrderItem"
    SET "deletedAt" = NEW."deletedAt", "updatedAt" = NOW()
    WHERE "orderId" = NEW.id AND "deletedAt" IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_soft_delete_order_items
AFTER UPDATE ON "Order"
FOR EACH ROW
EXECUTE FUNCTION soft_delete_order_items();

-- 5. Prevent accidental restoration of child entities
-- This trigger prevents restoring a child entity when its parent is still soft-deleted
CREATE OR REPLACE FUNCTION prevent_restore_with_deleted_parent()
RETURNS TRIGGER AS $$
DECLARE
  parent_deleted_at TIMESTAMP;
BEGIN
  -- Only check when restoring (deletedAt changing from non-null to null)
  IF NEW."deletedAt" IS NULL AND OLD."deletedAt" IS NOT NULL THEN
    
    -- Check if parent Product is deleted (for ProductVariant)
    IF TG_TABLE_NAME = 'ProductVariant' THEN
      SELECT "deletedAt" INTO parent_deleted_at
      FROM "Product"
      WHERE id = NEW."productId";
      
      IF parent_deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot restore variant: parent product is deleted';
      END IF;
    END IF;

    -- Check if parent Category is deleted (for Product)
    IF TG_TABLE_NAME = 'Product' AND NEW."categoryId" IS NOT NULL THEN
      SELECT "deletedAt" INTO parent_deleted_at
      FROM "Category"
      WHERE id = NEW."categoryId";
      
      IF parent_deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot restore product: parent category is deleted';
      END IF;
    END IF;

    -- Check if parent Order is deleted (for OrderItem)
    IF TG_TABLE_NAME = 'OrderItem' THEN
      SELECT "deletedAt" INTO parent_deleted_at
      FROM "Order"
      WHERE id = NEW."orderId";
      
      IF parent_deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot restore order item: parent order is deleted';
      END IF;
    END IF;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply restoration prevention to relevant tables
CREATE TRIGGER trigger_prevent_variant_restore_with_deleted_product
BEFORE UPDATE ON "ProductVariant"
FOR EACH ROW
EXECUTE FUNCTION prevent_restore_with_deleted_parent();

CREATE TRIGGER trigger_prevent_product_restore_with_deleted_category
BEFORE UPDATE ON "Product"
FOR EACH ROW
EXECUTE FUNCTION prevent_restore_with_deleted_parent();

CREATE TRIGGER trigger_prevent_order_item_restore_with_deleted_order
BEFORE UPDATE ON "OrderItem"
FOR EACH ROW
EXECUTE FUNCTION prevent_restore_with_deleted_parent();

-- ============================================================================
-- DEPLOYMENT INSTRUCTIONS
-- ============================================================================
-- 
-- 1. Backup production database:
--    pg_dump -h hostname -U username -d database > backup.sql
--
-- 2. Test in staging environment first
--
-- 3. Apply triggers:
--    psql -h hostname -U username -d database -f soft-delete-triggers.sql
--
-- 4. Verify triggers are created:
--    SELECT trigger_name, event_object_table FROM information_schema.triggers 
--    WHERE trigger_schema = 'public' ORDER BY event_object_table;
--
-- 5. Test soft delete behavior on staging data
--
-- 6. Monitor application logs for any trigger-related errors
--
-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
--
-- To remove all soft delete triggers:
--
-- DROP TRIGGER IF EXISTS trigger_soft_delete_product_variants ON "Product";
-- DROP TRIGGER IF EXISTS trigger_soft_delete_category_products ON "Category";
-- DROP TRIGGER IF EXISTS trigger_soft_delete_store_data ON "Store";
-- DROP TRIGGER IF EXISTS trigger_soft_delete_order_items ON "Order";
-- DROP TRIGGER IF EXISTS trigger_prevent_variant_restore_with_deleted_product ON "ProductVariant";
-- DROP TRIGGER IF EXISTS trigger_prevent_product_restore_with_deleted_category ON "Product";
-- DROP TRIGGER IF EXISTS trigger_prevent_order_item_restore_with_deleted_order ON "OrderItem";
--
-- DROP FUNCTION IF EXISTS soft_delete_product_variants();
-- DROP FUNCTION IF EXISTS soft_delete_category_products();
-- DROP FUNCTION IF EXISTS soft_delete_store_data();
-- DROP FUNCTION IF EXISTS soft_delete_order_items();
-- DROP FUNCTION IF EXISTS prevent_restore_with_deleted_parent();
--
-- ============================================================================
