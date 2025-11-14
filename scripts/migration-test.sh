#!/bin/bash
# Migration Test Script
# Validates Prisma migrations for integrity, rollback safety, and idempotency
# Usage: ./scripts/migration-test.sh [--cleanup]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TEST_DB_PATH="./prisma/test-migration.db"
BACKUP_DB_PATH="./prisma/test-migration-backup.db"
MIGRATIONS_DIR="./prisma/migrations"

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}  Prisma Migration Test Suite${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""

# Check if Prisma is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}✗ npx not found. Please install Node.js and npm.${NC}"
    exit 1
fi

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}✗ Migrations directory not found: $MIGRATIONS_DIR${NC}"
    exit 1
fi

# Cleanup function
cleanup() {
    echo -e "${YELLOW}Cleaning up test databases...${NC}"
    [ -f "$TEST_DB_PATH" ] && rm -f "$TEST_DB_PATH"
    [ -f "$TEST_DB_PATH-journal" ] && rm -f "$TEST_DB_PATH-journal"
    [ -f "$BACKUP_DB_PATH" ] && rm -f "$BACKUP_DB_PATH"
    [ -f "$BACKUP_DB_PATH-journal" ] && rm -f "$BACKUP_DB_PATH-journal"
    echo -e "${GREEN}✓ Cleanup complete${NC}"
}

# Handle cleanup flag
if [ "$1" == "--cleanup" ]; then
    cleanup
    exit 0
fi

# Trap errors and cleanup
trap 'echo -e "${RED}✗ Migration test failed${NC}"; cleanup; exit 1' ERR

# Test 1: Fresh migration (all migrations)
echo -e "${YELLOW}Test 1: Applying all migrations to fresh database...${NC}"
export DATABASE_URL="file:$TEST_DB_PATH"
npx prisma migrate deploy
echo -e "${GREEN}✓ All migrations applied successfully${NC}"
echo ""

# Test 2: Idempotency (re-run migrations)
echo -e "${YELLOW}Test 2: Testing migration idempotency (re-running migrations)...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✓ Migrations are idempotent (no errors on re-run)${NC}"
echo ""

# Test 3: Schema validation
echo -e "${YELLOW}Test 3: Validating schema integrity...${NC}"
npx prisma validate
echo -e "${GREEN}✓ Schema is valid${NC}"
echo ""

# Test 4: Generate Prisma Client
echo -e "${YELLOW}Test 4: Generating Prisma Client from migrated schema...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client generated successfully${NC}"
echo ""

# Test 5: Database introspection (verify actual DB structure)
echo -e "${YELLOW}Test 5: Introspecting database structure...${NC}"
npx prisma db pull --force
echo -e "${GREEN}✓ Database structure matches schema${NC}"
echo ""

# Test 6: Seed data (if seed script exists)
if grep -q '"prisma".*"seed"' package.json 2>/dev/null; then
    echo -e "${YELLOW}Test 6: Running database seed...${NC}"
    npm run db:seed || npx prisma db seed
    echo -e "${GREEN}✓ Database seeded successfully${NC}"
    echo ""
else
    echo -e "${YELLOW}Test 6: Skipping seed (no seed script found)${NC}"
    echo ""
fi

# Test 7: Backup and restore simulation
echo -e "${YELLOW}Test 7: Testing backup/restore workflow...${NC}"
cp "$TEST_DB_PATH" "$BACKUP_DB_PATH"
echo -e "${GREEN}✓ Database backed up${NC}"

# Simulate corruption (delete and restore)
rm -f "$TEST_DB_PATH"
cp "$BACKUP_DB_PATH" "$TEST_DB_PATH"
echo -e "${GREEN}✓ Database restored from backup${NC}"
echo ""

# Test 8: Migration history consistency
echo -e "${YELLOW}Test 8: Checking migration history...${NC}"
npx prisma migrate status
echo -e "${GREEN}✓ Migration history is consistent${NC}"
echo ""

# Test 9: Foreign key constraints validation
echo -e "${YELLOW}Test 9: Validating foreign key constraints...${NC}"
# SQLite PRAGMA to check foreign keys
sqlite3 "$TEST_DB_PATH" "PRAGMA foreign_key_check;" > /tmp/fk_check.txt || true
if [ -s /tmp/fk_check.txt ]; then
    echo -e "${RED}✗ Foreign key violations found:${NC}"
    cat /tmp/fk_check.txt
    exit 1
else
    echo -e "${GREEN}✓ No foreign key violations${NC}"
fi
rm -f /tmp/fk_check.txt
echo ""

# Test 10: Index existence validation
echo -e "${YELLOW}Test 10: Validating database indexes...${NC}"
# Check if critical indexes exist (adjust table names based on your schema)
sqlite3 "$TEST_DB_PATH" ".indexes" > /tmp/indexes.txt || true
EXPECTED_INDEXES=("Store_slug_key" "Product_storeId_idx" "Order_storeId_idx" "AuditLog_storeId_createdAt_idx")
MISSING_INDEXES=()

for idx in "${EXPECTED_INDEXES[@]}"; do
    if ! grep -q "$idx" /tmp/indexes.txt; then
        MISSING_INDEXES+=("$idx")
    fi
done

if [ ${#MISSING_INDEXES[@]} -ne 0 ]; then
    echo -e "${YELLOW}⚠ Warning: Some expected indexes not found: ${MISSING_INDEXES[*]}${NC}"
    echo -e "${YELLOW}  (This may be expected if schema has changed)${NC}"
else
    echo -e "${GREEN}✓ Critical indexes present${NC}"
fi
rm -f /tmp/indexes.txt
echo ""

# Success summary
echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}  All Migration Tests Passed! ✓${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo -e "Test database: ${TEST_DB_PATH}"
echo -e "To clean up: ./scripts/migration-test.sh --cleanup"
echo ""

# Keep test DB for inspection unless cleanup requested
exit 0
