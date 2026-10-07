import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupAllTransactions() {
  try {
    console.log('🧹 Starting complete database cleanup...');
    console.log('==========================================\n');

    console.log('⚠️  WARNING: This will delete ALL transactions and reset ALL users to 0!');
    console.log('Proceeding in 2 seconds...\n');
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📊 Step 1: Unlinking BottleCount records from transactions...');
    const unlinkedBottleCounts = await prisma.bottleCount.updateMany({
      where: {
        bottleTransactionId: { not: null }
      },
      data: {
        bottleTransactionId: null
      }
    });
    console.log(`   ✅ Unlinked ${unlinkedBottleCounts.count} BottleCount records\n`);

    console.log('📊 Step 2: Deleting all BottleTransaction records...');
    const deletedTransactions = await prisma.bottleTransaction.deleteMany({});
    console.log(`   ✅ Deleted ${deletedTransactions.count} BottleTransaction records\n`);

    console.log('📊 Step 3: Deleting all BottleCount records with userBottleCountId...');
    const deletedBottleCounts = await prisma.bottleCount.deleteMany({
      where: {
        userBottleCountId: { not: null }
      }
    });
    console.log(`   ✅ Deleted ${deletedBottleCounts.count} BottleCount records\n`);

    console.log('📊 Step 4: Resetting all UserBottleCount records to 0...');
    const updatedUsers = await prisma.userBottleCount.updateMany({
      data: {
        totalBottles: 0,
        redeemableCount: 0,
        lifetimeCount: 0,
        points: 0,
        lifetimePoints: 0,
      }
    });
    console.log(`   ✅ Reset ${updatedUsers.count} UserBottleCount records\n`);

    console.log('==========================================');
    console.log('✅ Cleanup completed successfully!');
    console.log('==========================================');
    console.log('\nSummary:');
    console.log(`   - Transactions deleted: ${deletedTransactions.count}`);
    console.log(`   - BottleCounts deleted: ${deletedBottleCounts.count}`);
    console.log(`   - Users reset: ${updatedUsers.count}`);
    console.log('\n🎯 Database is now clean. All users start from 0.');
    console.log('You can now test the grouped transaction system from scratch!\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAllTransactions()
  .then(() => {
    console.log('✨ Cleanup script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup script failed:', error);
    process.exit(1);
  });
