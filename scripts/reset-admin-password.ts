import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@stormcom.io';
  const newPassword = 'Admin@123';
  
  console.log(`Resetting password for: ${email}`);
  console.log(`New password: ${newPassword}`);
  
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log('\n✅ Password reset successfully!');
  console.log(`\nYou can now login with:`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${newPassword}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
