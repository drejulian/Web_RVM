import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncUserBottleCounts() {
  try {
    console.log('🔄 Starting UserBottleCount sync...');
    console.log('==========================================\n');

    const allUsers = await prisma.user.findMany({
      include: {
        bottleCount: true,
      },
    });

    console.log(`📊 Found ${allUsers.length} users\n`);

    let updatedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;

    for (const user of allUsers) {
      console.log(`\n👤 Processing user: ${user.email} (${user.id})`);

      let userBottleCount = user.bottleCount;

      if (!userBottleCount) {
        console.log('   📝 Creating new UserBottleCount record...');
        userBottleCount = await prisma.userBottleCount.create({
          data: {
            userId: user.id,
            totalBottles: 0,
            redeemableCount: 0,
            lifetimeCount: 0,
            points: 0,
            lifetimePoints: 0,
          },
        });
        createdCount++;
      }

      const transactions = await prisma.bottleTransaction.findMany({
        where: {
          userBottleCountId: userBottleCount.id,
        },
        orderBy: {
          timestamp: 'asc',
        },
        include: {
          bottleCounts: true,
        },
      });

      const pendingBottles = await prisma.bottleCount.findMany({
        where: {
          userBottleCountId: userBottleCount.id,
          bottleTransactionId: null,
        },
      });

      if (transactions.length === 0 && pendingBottles.length === 0) {
        console.log('   📭 No transactions or pending bottles found, skipping...');
        skippedCount++;
        continue;
      }

      console.log(`   📦 Found ${transactions.length} transactions`);
      console.log(`   🔄 Found ${pendingBottles.length} pending bottles (not yet in transactions)`);

      let totalBottlesDeposited = 0;
      let totalPointsEarned = 0;
      let totalBottlesRedeemed = 0;
      let totalPointsRedeemed = 0;

      for (const tx of transactions) {
        let txBottleCount = tx.bottleCount;
        
        if (txBottleCount === 0 && tx.bottleCounts && tx.bottleCounts.length > 0) {
          txBottleCount = tx.bottleCounts.reduce((sum, bc) => sum + bc.count, 0);
          console.log(`   📝 Transaction ${tx.id.substring(0, 8)} had bottleCount=0, recalculated from linked BottleCounts: ${txBottleCount}`);
        }

        if (tx.transactionType === 'DEPOSIT') {
          totalBottlesDeposited += txBottleCount;
          totalPointsEarned += tx.pointsEarned || (txBottleCount * 50);
        } else if (tx.transactionType === 'REDEEM') {
          totalPointsRedeemed += Math.abs(tx.pointsEarned);
        }
      }

      const pendingBottleCount = pendingBottles.reduce((sum, bc) => sum + bc.count, 0);
      const pendingPoints = pendingBottleCount * 50;
      
      totalBottlesDeposited += pendingBottleCount;
      totalPointsEarned += pendingPoints;

      if (pendingBottleCount > 0) {
        console.log(`   ➕ Added ${pendingBottleCount} pending bottles with ${pendingPoints} points`);
      }

      const currentBottles = totalBottlesDeposited - totalBottlesRedeemed;
      const currentPoints = totalPointsEarned - totalPointsRedeemed;

      console.log('   📊 Calculated totals:');
      console.log(`      - Bottles deposited: ${totalBottlesDeposited}`);
      console.log(`      - Bottles redeemed: ${totalBottlesRedeemed}`);
      console.log(`      - Current bottles: ${currentBottles}`);
      console.log(`      - Points earned: ${totalPointsEarned}`);
      console.log(`      - Points redeemed: ${totalPointsRedeemed}`);
      console.log(`      - Current points: ${currentPoints}`);

      await prisma.userBottleCount.update({
        where: { id: userBottleCount.id },
        data: {
          totalBottles: currentBottles,
          redeemableCount: currentBottles,
          lifetimeCount: totalBottlesDeposited,
          points: currentPoints,
          lifetimePoints: totalPointsEarned,
        },
      });

      console.log('   ✅ UserBottleCount updated successfully');
      updatedCount++;
    }

    console.log('\n==========================================');
    console.log('✅ Sync completed successfully!');
    console.log(`   - Created: ${createdCount} records`);
    console.log(`   - Updated: ${updatedCount} records`);
    console.log(`   - Skipped: ${skippedCount} records (no transactions)`);
    console.log('==========================================\n');
  } catch (error) {
    console.error('❌ Error syncing UserBottleCount:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

syncUserBottleCounts()
  .then(() => {
    console.log('✨ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
