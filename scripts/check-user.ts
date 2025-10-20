import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@stormcom.io';
  console.log(`Checking user: ${email}`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      stores: {
        include: {
          store: true,
          role: true,
        },
      },
    },
  });

  if (!user) {
    console.log('❌ User not found!');
    return;
  }

  console.log('\n✅ User found:');
  console.log(`  ID: ${user.id}`);
  console.log(`  Name: ${user.name}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Status: ${user.status}`);
  console.log(`  Email Verified: ${user.emailVerified}`);
  console.log(`  Stores: ${user.stores.length}`);
  
  if (user.stores.length > 0) {
    console.log('\n  Store Associations:');
    user.stores.forEach((us) => {
      console.log(`    - ${us.store.name} (${us.store.slug}) - Role: ${us.role.name}`);
    });
  } else {
    console.log('\n  ⚠️ User has no store associations!');
  }

  // Test password
  const testPassword = 'Admin@123';
  const isValid = await bcrypt.compare(testPassword, user.password || '');
  console.log(`\n  Password "${testPassword}": ${isValid ? '✅ Valid' : '❌ Invalid'}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
