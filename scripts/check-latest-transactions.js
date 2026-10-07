import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLatestTransactions() {
  try {
    console.log('📊 Checking latest transactions...\n');

    const transactions = await prisma.bottleTransaction.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        userBottleCount: {
          include: {
            user: {
              select: { email: true, nama: true }
            }
          }
        },
        bottleCounts: {
          select: { id: true, count: true, timestamp: true }
        }
      }
    });

    console.log(`Found ${transactions.length} recent transaction(s):\n`);

    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. Transaction ID: ${tx.id.substring(0, 8)}`);
      console.log(`   User: ${tx.userBottleCount.user.email}`);
      console.log(`   Type: ${tx.transactionType}`);
      console.log(`   Bottle Count: ${tx.bottleCount} 🍾`);
      console.log(`   Points Earned: ${tx.pointsEarned}`);
      console.log(`   Timestamp: ${tx.timestamp}`);
      console.log(`   Linked BottleCounts: ${tx.bottleCounts.length} records`);
      if (tx.bottleCounts.length > 0) {
        tx.bottleCounts.forEach((bc, i) => {
          console.log(`      - BottleCount ${i + 1}: count=${bc.count}, time=${bc.timestamp.toISOString()}`);
        });
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestTransactions();
