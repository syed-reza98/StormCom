// tests/e2e/helpers/test-data.ts
// Test data seeding helpers for E2E tests

interface TestStore {
  id: string;
  name: string;
  domain: string;
  ownerId: string;
}

interface TestUser {
  id: string;
  email: string;
  password: string;
  role: 'OWNER' | 'CUSTOMER';
  storeId?: string;
}

interface TestProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  storeId: string;
  categoryId: string;
  stock: number;
  isActive: boolean;
}

interface TestCategory {
  id: string;
  name: string;
  slug: string;
  storeId: string;
}

export async function seedTestData() {
  // In a real application, this would interact with your database
  // For now, we'll mock the data seeding process
  
  console.log('Seeding test data...');
  
  // Create test store
  const testStore: TestStore = {
    id: 'test-store-1',
    name: 'Test Store',
    domain: 'teststore.local',
    ownerId: 'test-owner-1',
  };
  
  // Create test users
  const testUsers: TestUser[] = [
    {
      id: 'test-owner-1',
      email: 'owner@teststore.com',
      password: 'password123',
      role: 'OWNER',
      storeId: testStore.id,
    },
    {
      id: 'test-customer-1',
      email: 'customer@test.com',
      password: 'password123',
      role: 'CUSTOMER',
    },
  ];
  
  // Create test categories
  const testCategories: TestCategory[] = [
    {
      id: 'cat-electronics',
      name: 'Electronics',
      slug: 'electronics',
      storeId: testStore.id,
    },
    {
      id: 'cat-clothing',
      name: 'Clothing',
      slug: 'clothing',
      storeId: testStore.id,
    },
    {
      id: 'cat-books',
      name: 'Books',
      slug: 'books',
      storeId: testStore.id,
    },
  ];
  
  // Create test products
  const testProducts: TestProduct[] = [
    {
      id: 'prod-laptop-1',
      name: 'Gaming Laptop Pro',
      sku: 'LAPTOP-001',
      price: 1299.99,
      storeId: testStore.id,
      categoryId: 'cat-electronics',
      stock: 25,
      isActive: true,
    },
    {
      id: 'prod-smartphone-1',
      name: 'Smartphone Ultra',
      sku: 'PHONE-001',
      price: 799.99,
      storeId: testStore.id,
      categoryId: 'cat-electronics',
      stock: 50,
      isActive: true,
    },
    {
      id: 'prod-tshirt-1',
      name: 'Cotton T-Shirt',
      sku: 'SHIRT-001',
      price: 29.99,
      storeId: testStore.id,
      categoryId: 'cat-clothing',
      stock: 100,
      isActive: true,
    },
    {
      id: 'prod-jeans-1',
      name: 'Denim Jeans',
      sku: 'JEANS-001',
      price: 79.99,
      storeId: testStore.id,
      categoryId: 'cat-clothing',
      stock: 75,
      isActive: true,
    },
    {
      id: 'prod-book-1',
      name: 'Programming Guide',
      sku: 'BOOK-001',
      price: 49.99,
      storeId: testStore.id,
      categoryId: 'cat-books',
      stock: 30,
      isActive: true,
    },
  ];
  
  // Mock API calls to seed data
  // In a real app, you would make actual API calls or database operations
  
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Test data seeded successfully:', {
      store: testStore,
      users: testUsers.length,
      categories: testCategories.length,
      products: testProducts.length,
    });
    
    return {
      store: testStore,
      users: testUsers,
      categories: testCategories,
      products: testProducts,
    };
    
  } catch (error) {
    console.error('Failed to seed test data:', error);
    throw error;
  }
}

export async function cleanupTestData() {
  // Clean up test data after tests
  console.log('Cleaning up test data...');
  
  try {
    // Simulate cleanup operations
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log('Test data cleaned up successfully');
    
  } catch (error) {
    console.error('Failed to cleanup test data:', error);
    throw error;
  }
}

export function getTestProduct(sku: string): TestProduct | undefined {
  const products: TestProduct[] = [
    {
      id: 'prod-laptop-1',
      name: 'Gaming Laptop Pro',
      sku: 'LAPTOP-001',
      price: 1299.99,
      storeId: 'test-store-1',
      categoryId: 'cat-electronics',
      stock: 25,
      isActive: true,
    },
    // Add more test products as needed
  ];
  
  return products.find(product => product.sku === sku);
}

export function getTestUser(email: string): TestUser | undefined {
  const users: TestUser[] = [
    {
      id: 'test-owner-1',
      email: 'owner@teststore.com',
      password: 'password123',
      role: 'OWNER',
      storeId: 'test-store-1',
    },
    {
      id: 'test-customer-1',
      email: 'customer@test.com',
      password: 'password123',
      role: 'CUSTOMER',
    },
  ];
  
  return users.find(user => user.email === email);
}