/**
 * JSON Migration Validation Script for T038g-T038m
 * 
 * This script validates that all String fields to be migrated to Json type
 * contain valid JSON data before running the migration.
 * 
 * Fields validated:
 * - T038g: ShippingZone.countries (String → Json)
 * - T038h: Page.metaKeywords (String → Json)
 * - T038i: EmailTemplate.variables (String → Json)
 * - T038j: Webhook.events (String → Json)
 * - T038k: Payment.metadata (String? → Json?)
 * - T038l: SyncLog.metadata (String? → Json?)
 * - T038m: AuditLog.changes (String? → Json?)
 * 
 * Run with: npx tsx scripts/migrations/validate-json-migration-t038g-m.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ValidationResult {
  field: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  sampleInvalid: Array<{ id: string; value: string | null }>;
}

/**
 * Validate ShippingZone.countries field (T038g)
 * Expected: JSON array of ISO country codes e.g., ["US", "CA"]
 */
async function validateShippingZoneCountries(): Promise<ValidationResult> {
  const zones = await prisma.$queryRaw<Array<{ id: string; countries: string }>>`
    SELECT id, countries FROM shipping_zones
  `;

  let validCount = 0;
  let invalidCount = 0;
  const sampleInvalid: Array<{ id: string; value: string | null }> = [];

  for (const zone of zones) {
    try {
      const parsed = JSON.parse(zone.countries);
      if (Array.isArray(parsed)) {
        validCount++;
      } else {
        invalidCount++;
        if (sampleInvalid.length < 5) {
          sampleInvalid.push({ id: zone.id, value: zone.countries });
        }
      }
    } catch (error) {
      invalidCount++;
      if (sampleInvalid.length < 5) {
        sampleInvalid.push({ id: zone.id, value: zone.countries });
      }
    }
  }

  return {
    field: 'ShippingZone.countries',
    totalRecords: zones.length,
    validRecords: validCount,
    invalidRecords: invalidCount,
    sampleInvalid,
  };
}

/**
 * Validate Page.metaKeywords field (T038h)
 * Expected: JSON array of keyword strings
 */
async function validatePageMetaKeywords(): Promise<ValidationResult> {
  const pages = await prisma.$queryRaw<Array<{ id: string; metaKeywords: string }>>`
    SELECT id, metaKeywords FROM pages
  `;

  let validCount = 0;
  let invalidCount = 0;
  const sampleInvalid: Array<{ id: string; value: string | null }> = [];

  for (const page of pages) {
    try {
      const parsed = JSON.parse(page.metaKeywords);
      if (Array.isArray(parsed)) {
        validCount++;
      } else {
        invalidCount++;
        if (sampleInvalid.length < 5) {
          sampleInvalid.push({ id: page.id, value: page.metaKeywords });
        }
      }
    } catch (error) {
      invalidCount++;
      if (sampleInvalid.length < 5) {
        sampleInvalid.push({ id: page.id, value: page.metaKeywords });
      }
    }
  }

  return {
    field: 'Page.metaKeywords',
    totalRecords: pages.length,
    validRecords: validCount,
    invalidRecords: invalidCount,
    sampleInvalid,
  };
}

/**
 * Validate EmailTemplate.variables field (T038i)
 * Expected: JSON array of template variable strings e.g., ["{{customerName}}", "{{orderNumber}}"]
 */
async function validateEmailTemplateVariables(): Promise<ValidationResult> {
  const templates = await prisma.$queryRaw<Array<{ id: string; variables: string }>>`
    SELECT id, variables FROM email_templates
  `;

  let validCount = 0;
  let invalidCount = 0;
  const sampleInvalid: Array<{ id: string; value: string | null }> = [];

  for (const template of templates) {
    try {
      const parsed = JSON.parse(template.variables);
      if (Array.isArray(parsed)) {
        validCount++;
      } else {
        invalidCount++;
        if (sampleInvalid.length < 5) {
          sampleInvalid.push({ id: template.id, value: template.variables });
        }
      }
    } catch (error) {
      invalidCount++;
      if (sampleInvalid.length < 5) {
        sampleInvalid.push({ id: template.id, value: template.variables });
      }
    }
  }

  return {
    field: 'EmailTemplate.variables',
    totalRecords: templates.length,
    validRecords: validCount,
    invalidRecords: invalidCount,
    sampleInvalid,
  };
}

/**
 * Validate Webhook.events field (T038j)
 * Expected: JSON array of event names e.g., ["order.created", "product.updated"]
 */
async function validateWebhookEvents(): Promise<ValidationResult> {
  const webhooks = await prisma.$queryRaw<Array<{ id: string; events: string }>>`
    SELECT id, events FROM webhooks
  `;

  let validCount = 0;
  let invalidCount = 0;
  const sampleInvalid: Array<{ id: string; value: string | null }> = [];

  for (const webhook of webhooks) {
    try {
      const parsed = JSON.parse(webhook.events);
      if (Array.isArray(parsed)) {
        validCount++;
      } else {
        invalidCount++;
        if (sampleInvalid.length < 5) {
          sampleInvalid.push({ id: webhook.id, value: webhook.events });
        }
      }
    } catch (error) {
      invalidCount++;
      if (sampleInvalid.length < 5) {
        sampleInvalid.push({ id: webhook.id, value: webhook.events });
      }
    }
  }

  return {
    field: 'Webhook.events',
    totalRecords: webhooks.length,
    validRecords: validCount,
    invalidRecords: invalidCount,
    sampleInvalid,
  };
}

/**
 * Validate Payment.metadata field (T038k)
 * Expected: Optional JSON object with gateway-specific data
 */
async function validatePaymentMetadata(): Promise<ValidationResult> {
  const payments = await prisma.$queryRaw<Array<{ id: string; metadata: string | null }>>`
    SELECT id, metadata FROM payments WHERE metadata IS NOT NULL
  `;

  let validCount = 0;
  let invalidCount = 0;
  const sampleInvalid: Array<{ id: string; value: string | null }> = [];

  for (const payment of payments) {
    if (payment.metadata === null) {
      validCount++; // NULL is valid for optional field
      continue;
    }

    try {
      const parsed = JSON.parse(payment.metadata);
      if (typeof parsed === 'object' && parsed !== null) {
        validCount++;
      } else {
        invalidCount++;
        if (sampleInvalid.length < 5) {
          sampleInvalid.push({ id: payment.id, value: payment.metadata });
        }
      }
    } catch (error) {
      invalidCount++;
      if (sampleInvalid.length < 5) {
        sampleInvalid.push({ id: payment.id, value: payment.metadata });
      }
    }
  }

  return {
    field: 'Payment.metadata',
    totalRecords: payments.length,
    validRecords: validCount,
    invalidRecords: invalidCount,
    sampleInvalid,
  };
}

/**
 * Validate SyncLog.metadata field (T038l)
 * Expected: Optional JSON object with sync processing metadata
 */
async function validateSyncLogMetadata(): Promise<ValidationResult> {
  const syncLogs = await prisma.$queryRaw<Array<{ id: string; metadata: string | null }>>`
    SELECT id, metadata FROM sync_logs WHERE metadata IS NOT NULL
  `;

  let validCount = 0;
  let invalidCount = 0;
  const sampleInvalid: Array<{ id: string; value: string | null }> = [];

  for (const log of syncLogs) {
    if (log.metadata === null) {
      validCount++; // NULL is valid for optional field
      continue;
    }

    try {
      const parsed = JSON.parse(log.metadata);
      if (typeof parsed === 'object' && parsed !== null) {
        validCount++;
      } else {
        invalidCount++;
        if (sampleInvalid.length < 5) {
          sampleInvalid.push({ id: log.id, value: log.metadata });
        }
      }
    } catch (error) {
      invalidCount++;
      if (sampleInvalid.length < 5) {
        sampleInvalid.push({ id: log.id, value: log.metadata });
      }
    }
  }

  return {
    field: 'SyncLog.metadata',
    totalRecords: syncLogs.length,
    validRecords: validCount,
    invalidRecords: invalidCount,
    sampleInvalid,
  };
}

/**
 * Validate AuditLog.changes field (T038m)
 * Expected: Optional JSON object with field diffs e.g., { "field": { "old": "value", "new": "value" } }
 */
async function validateAuditLogChanges(): Promise<ValidationResult> {
  const auditLogs = await prisma.$queryRaw<Array<{ id: string; changes: string | null }>>`
    SELECT id, changes FROM audit_logs WHERE changes IS NOT NULL
  `;

  let validCount = 0;
  let invalidCount = 0;
  const sampleInvalid: Array<{ id: string; value: string | null }> = [];

  for (const log of auditLogs) {
    if (log.changes === null) {
      validCount++; // NULL is valid for optional field
      continue;
    }

    try {
      const parsed = JSON.parse(log.changes);
      if (typeof parsed === 'object' && parsed !== null) {
        validCount++;
      } else {
        invalidCount++;
        if (sampleInvalid.length < 5) {
          sampleInvalid.push({ id: log.id, value: log.changes });
        }
      }
    } catch (error) {
      invalidCount++;
      if (sampleInvalid.length < 5) {
        sampleInvalid.push({ id: log.id, value: log.changes });
      }
    }
  }

  return {
    field: 'AuditLog.changes',
    totalRecords: auditLogs.length,
    validRecords: validCount,
    invalidRecords: invalidCount,
    sampleInvalid,
  };
}

/**
 * Print validation report
 */
function printReport(results: ValidationResult[]): void {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  JSON Migration Validation Report (T038g-T038m)');
  console.log('═══════════════════════════════════════════════════════════\n');

  let hasErrors = false;

  for (const result of results) {
    const status = result.invalidRecords === 0 ? '✅' : '❌';
    console.log(`${status} ${result.field}`);
    console.log(`   Total records: ${result.totalRecords}`);
    console.log(`   Valid JSON: ${result.validRecords}`);
    console.log(`   Invalid JSON: ${result.invalidRecords}`);

    if (result.invalidRecords > 0) {
      hasErrors = true;
      console.log('\n   Sample invalid records:');
      for (const sample of result.sampleInvalid) {
        console.log(`   - ID: ${sample.id}`);
        console.log(`     Value: ${sample.value?.substring(0, 100)}...`);
      }
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  if (hasErrors) {
    console.log('❌ VALIDATION FAILED: Some fields contain invalid JSON data.');
    console.log('   Please fix the invalid records before running the migration.\n');
    process.exit(1);
  } else {
    console.log('✅ All data is valid JSON! Safe to proceed with migration.\n');
    process.exit(0);
  }
}

/**
 * Main validation function
 */
async function main(): Promise<void> {
  console.log('Starting JSON migration validation for T038g-T038m...\n');

  try {
    const results = await Promise.all([
      validateShippingZoneCountries(),
      validatePageMetaKeywords(),
      validateEmailTemplateVariables(),
      validateWebhookEvents(),
      validatePaymentMetadata(),
      validateSyncLogMetadata(),
      validateAuditLogChanges(),
    ]);

    printReport(results);
  } catch (error) {
    console.error('Error during validation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
