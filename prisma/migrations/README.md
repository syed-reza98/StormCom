# Database Migrations

This directory contains Prisma database migrations for the StormCom platform.

## Migration Strategy

- **Development**: Use `npx prisma db push` for rapid schema iteration
- **Production**: Use `npx prisma migrate deploy` for controlled migrations

## Soft Delete Validation

The platform uses soft deletes (deletedAt field) for user-facing data to maintain referential integrity and enable recovery.

### Soft Delete Rules

1. **Cascade Behavior**: When a parent is soft-deleted, children are also soft-deleted
   - Example: Deleting a Product soft-deletes all ProductVariants

2. **Query Filtering**: All queries must filter `WHERE deletedAt IS NULL` to exclude soft-deleted records
   - This is enforced via `withoutDeleted()` helper in `src/lib/middleware/tenantIsolation.ts`

3. **Unique Constraints**: Unique constraints must include `deletedAt` to allow re-use of values after soft delete
   - Example: `@@unique([storeId, slug, deletedAt])`

### Database Triggers (SQLite Limitations)

**Note**: SQLite does not support complex triggers for soft delete validation. Instead, we enforce soft delete rules at the application level:

- **Service Layer**: All delete operations in `src/services/**/*-service.ts` use soft delete logic
- **Middleware**: `withoutDeleted()` helper ensures queries exclude soft-deleted records
- **API Routes**: Delete endpoints call service methods that perform soft deletes

For PostgreSQL production deployments, consider adding database triggers:

```sql
-- Example PostgreSQL trigger for cascade soft deletes
CREATE OR REPLACE FUNCTION soft_delete_product_variants()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deletedAt IS NOT NULL AND OLD.deletedAt IS NULL THEN
    UPDATE "ProductVariant"
    SET "deletedAt" = NEW.deletedAt
    WHERE "productId" = NEW.id AND "deletedAt" IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_soft_delete_product_variants
AFTER UPDATE ON "Product"
FOR EACH ROW
EXECUTE FUNCTION soft_delete_product_variants();
```

### PostgreSQL Production Triggers

When deploying to PostgreSQL, add these triggers via migration:

```prisma
-- Migration: add_soft_delete_triggers
-- 1. Product → ProductVariant cascade
-- 2. Category → Product cascade  
-- 3. Store → All child entities cascade
-- 4. Order → OrderItem, Payment, Shipment cascade

-- See docs/database/soft-delete-triggers.sql for complete trigger definitions
```

## Migration Workflow

1. **Create Migration**:
   ```bash
   npx prisma migrate dev --name descriptive-name
   ```

2. **Review Migration**:
   - Check generated SQL in `migrations/[timestamp]_descriptive-name/migration.sql`
   - Verify no data loss or breaking changes

3. **Test Migration**:
   - Apply to local development database
   - Run tests: `npm run test`
   - Verify data integrity

4. **Deploy to Production**:
   ```bash
   npx prisma migrate deploy
   ```

5. **Rollback (if needed)**:
   - See `docs/operations/migration-rollback.md` for rollback procedures

## Important Notes

- **Never edit migration files manually** after they've been applied
- **Always backup production database** before running migrations
- **Test migrations on staging** environment first
- **Monitor performance** of migrations on large tables
- **Plan for downtime** if migration requires exclusive locks

## Related Documentation

- [Database Schema Guide](../docs/database/schema-guide.md)
- [Migration Rollback Procedures](../docs/operations/migration-rollback.md)
- [Soft Delete Implementation](../docs/database/soft-delete-guide.md)
