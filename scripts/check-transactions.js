import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTransactions() {
  try {
    console.log('🔍 Checking recent transactions...\n');

    const transactions = await prisma.bottleTransaction.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        userBottleCount: {
          include: {
            user: {
              select: { email: true, nama: true }
            }
          }
        }
      }
    });

    console.log(`📊 Found ${transactions.length} recent transactions:\n`);

    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. Transaction ID: ${tx.id}`);
      console.log(`   User: ${tx.userBottleCount.user.email}`);
      console.log(`   Type: ${tx.transactionType}`);
      console.log(`   Bottle Count: ${tx.bottleCount}`);
      console.log(`   Points Earned: ${tx.pointsEarned}`);
      console.log(`   Timestamp: ${tx.timestamp}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactions();
