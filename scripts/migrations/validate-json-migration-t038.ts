/**
 * T038b-T038f: Validate JSON Migration
 * 
 * This script validates that String → Json migrations preserve data integrity.
 * Run BEFORE applying migration to check data format.
 * 
 * Tasks covered:
 * - T038b: Product.images
 * - T038c: Product.metaKeywords
 * - T038d: ProductVariant.options
 * - T038e: ProductAttribute.values
 * - T038f: Review.images
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ValidationResult {
  model: string;
  field: string;
  totalRecords: number;
  validJson: number;
  invalidJson: number;
  errors: Array<{ id: string; value: string; error: string }>;
}

async function validateProductImages(): Promise<ValidationResult> {
  console.log('🔍 Validating Product.images...');
  
  const products = await prisma.$queryRaw<Array<{ id: string; images: string }>>`
    SELECT id, images FROM products
  `;
  
  const result: ValidationResult = {
    model: 'Product',
    field: 'images',
    totalRecords: products.length,
    validJson: 0,
    invalidJson: 0,
    errors: [],
  };
  
  for (const product of products) {
    try {
      const parsed = JSON.parse(product.images);
      if (!Array.isArray(parsed)) {
        result.errors.push({
          id: product.id,
          value: product.images,
          error: 'Not an array',
        });
        result.invalidJson++;
      } else {
        result.validJson++;
      }
    } catch (error) {
      result.errors.push({
        id: product.id,
        value: product.images,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      result.invalidJson++;
    }
  }
  
  return result;
}

async function validateProductMetaKeywords(): Promise<ValidationResult> {
  console.log('🔍 Validating Product.metaKeywords...');
  
  const products = await prisma.$queryRaw<Array<{ id: string; metaKeywords: string }>>`
    SELECT id, metaKeywords FROM products
  `;
  
  const result: ValidationResult = {
    model: 'Product',
    field: 'metaKeywords',
    totalRecords: products.length,
    validJson: 0,
    invalidJson: 0,
    errors: [],
  };
  
  for (const product of products) {
    try {
      const parsed = JSON.parse(product.metaKeywords);
      if (!Array.isArray(parsed)) {
        result.errors.push({
          id: product.id,
          value: product.metaKeywords,
          error: 'Not an array',
        });
        result.invalidJson++;
      } else {
        result.validJson++;
      }
    } catch (error) {
      result.errors.push({
        id: product.id,
        value: product.metaKeywords,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      result.invalidJson++;
    }
  }
  
  return result;
}

async function validateProductVariantOptions(): Promise<ValidationResult> {
  console.log('🔍 Validating ProductVariant.options...');
  
  const variants = await prisma.$queryRaw<Array<{ id: string; options: string }>>`
    SELECT id, options FROM product_variants
  `;
  
  const result: ValidationResult = {
    model: 'ProductVariant',
    field: 'options',
    totalRecords: variants.length,
    validJson: 0,
    invalidJson: 0,
    errors: [],
  };
  
  for (const variant of variants) {
    try {
      const parsed = JSON.parse(variant.options);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        result.errors.push({
          id: variant.id,
          value: variant.options,
          error: 'Not an object',
        });
        result.invalidJson++;
      } else {
        result.validJson++;
      }
    } catch (error) {
      result.errors.push({
        id: variant.id,
        value: variant.options,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      result.invalidJson++;
    }
  }
  
  return result;
}

async function validateProductAttributeValues(): Promise<ValidationResult> {
  console.log('🔍 Validating ProductAttribute.values...');
  
  const attributes = await prisma.$queryRaw<Array<{ id: string; values: string }>>`
    SELECT id, "values" FROM product_attributes
  `;
  
  const result: ValidationResult = {
    model: 'ProductAttribute',
    field: 'values',
    totalRecords: attributes.length,
    validJson: 0,
    invalidJson: 0,
    errors: [],
  };
  
  for (const attribute of attributes) {
    try {
      const parsed = JSON.parse(attribute.values);
      if (!Array.isArray(parsed)) {
        result.errors.push({
          id: attribute.id,
          value: attribute.values,
          error: 'Not an array',
        });
        result.invalidJson++;
      } else {
        result.validJson++;
      }
    } catch (error) {
      result.errors.push({
        id: attribute.id,
        value: attribute.values,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      result.invalidJson++;
    }
  }
  
  return result;
}

async function validateReviewImages(): Promise<ValidationResult> {
  console.log('🔍 Validating Review.images...');
  
  const reviews = await prisma.$queryRaw<Array<{ id: string; images: string }>>`
    SELECT id, images FROM reviews
  `;
  
  const result: ValidationResult = {
    model: 'Review',
    field: 'images',
    totalRecords: reviews.length,
    validJson: 0,
    invalidJson: 0,
    errors: [],
  };
  
  for (const review of reviews) {
    try {
      const parsed = JSON.parse(review.images);
      if (!Array.isArray(parsed)) {
        result.errors.push({
          id: review.id,
          value: review.images,
          error: 'Not an array',
        });
        result.invalidJson++;
      } else {
        result.validJson++;
      }
    } catch (error) {
      result.errors.push({
        id: review.id,
        value: review.images,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      result.invalidJson++;
    }
  }
  
  return result;
}

function printReport(results: ValidationResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 JSON Migration Validation Report (T038b-T038f)');
  console.log('='.repeat(80) + '\n');
  
  let totalRecords = 0;
  let totalValid = 0;
  let totalInvalid = 0;
  
  for (const result of results) {
    totalRecords += result.totalRecords;
    totalValid += result.validJson;
    totalInvalid += result.invalidJson;
    
    console.log(`${result.model}.${result.field}:`);
    console.log(`  Total Records: ${result.totalRecords}`);
    console.log(`  ✅ Valid JSON: ${result.validJson} (${((result.validJson / result.totalRecords) * 100).toFixed(1)}%)`);
    console.log(`  ❌ Invalid JSON: ${result.invalidJson} (${((result.invalidJson / result.totalRecords) * 100).toFixed(1)}%)`);
    
    if (result.errors.length > 0) {
      console.log(`  Errors (showing first 5):`);
      result.errors.slice(0, 5).forEach(error => {
        console.log(`    - ID: ${error.id.substring(0, 8)}... | Error: ${error.error}`);
        console.log(`      Value: ${error.value.substring(0, 50)}${error.value.length > 50 ? '...' : ''}`);
      });
    }
    console.log('');
  }
  
  console.log('─'.repeat(80));
  console.log(`📈 Summary:`);
  console.log(`  Total Records: ${totalRecords}`);
  console.log(`  ✅ Valid: ${totalValid} (${((totalValid / totalRecords) * 100).toFixed(1)}%)`);
  console.log(`  ❌ Invalid: ${totalInvalid} (${((totalInvalid / totalRecords) * 100).toFixed(1)}%)`);
  console.log('─'.repeat(80) + '\n');
  
  if (totalInvalid === 0) {
    console.log('✅ All data is valid JSON! Safe to proceed with migration.\n');
  } else {
    console.log('⚠️  Warning: Some data is invalid JSON. Fix errors before migration.\n');
    process.exit(1);
  }
}

async function main() {
  try {
    console.log('🚀 Starting JSON migration validation (T038b-T038f)...\n');
    
    const results = await Promise.all([
      validateProductImages(),
      validateProductMetaKeywords(),
      validateProductVariantOptions(),
      validateProductAttributeValues(),
      validateReviewImages(),
    ]);
    
    printReport(results);
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
