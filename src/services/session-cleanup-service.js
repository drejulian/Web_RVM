import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class SessionCleanupService {
  async finalizeExpiredSessions() {
    try {
      console.log('🧹 Starting expired session cleanup...');
      
      const expiredSessions = await prisma.arduinoSession.findMany({
        where: {
          isActive: true,
          expiresAt: {
            lt: new Date(),
          },
        },
        include: {
          device: {
            select: {
              deviceId: true,
              locationId: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      if (expiredSessions.length === 0) {
        console.log('✅ No expired sessions found');
        return {
          success: true,
          sessionsFinalized: 0,
          transactionsCreated: 0,
          bottlesProcessed: 0,
        };
      }

      console.log(`📦 Found ${expiredSessions.length} expired session(s) to finalize`);

      let totalTransactionsCreated = 0;
      let totalBottlesProcessed = 0;
      let totalSessionsFinalized = 0;

      for (const session of expiredSessions) {
        try {
          console.log(`📝 Processing session ${session.id} for user ${session.userId}`);
          
          const userBottleCount = await prisma.userBottleCount.findUnique({
            where: { userId: session.userId },
          });

          if (!userBottleCount) {
            console.log(`⚠️ No UserBottleCount found for user ${session.userId}`);
            await prisma.arduinoSession.update({
              where: { id: session.id },
              data: { isActive: false },
            });
            totalSessionsFinalized++;
            continue;
          }

          const bottleRecords = await prisma.bottleCount.findMany({
            where: {
              userBottleCountId: userBottleCount.id,
              deviceId: session.deviceId,
              bottleTransactionId: null,
            },
            orderBy: {
              timestamp: 'asc',
            },
          });

          if (bottleRecords.length > 0) {
            const totalBottles = bottleRecords.reduce((sum, record) => sum + record.count, 0);
            const pointsEarned = totalBottles * 50;
            
            console.log(`📊 Creating grouped transaction: ${totalBottles} bottles, ${pointsEarned} points`);

            const transaction = await prisma.bottleTransaction.create({
              data: {
                userBottleCountId: userBottleCount.id,
                deviceId: session.deviceId,
                locationId: session.device?.locationId || null,
                transactionType: 'DEPOSIT',
                bottleCount: totalBottles,
                pointsEarned,
                timestamp: bottleRecords[0].timestamp,
              },
            });

            await prisma.bottleCount.updateMany({
              where: {
                id: { in: bottleRecords.map(r => r.id) },
              },
              data: {
                bottleTransactionId: transaction.id,
              },
            });

            totalTransactionsCreated++;
            totalBottlesProcessed += totalBottles;
            
            console.log(`✅ Transaction created: ${transaction.id} with ${totalBottles} bottles`);
          } else {
            console.log(`📭 No bottles found for session ${session.id}`);
          }

          await prisma.arduinoSession.update({
            where: { id: session.id },
            data: { isActive: false },
          });
          
          totalSessionsFinalized++;

          if (global.io) {
            global.io.emit('session_expired', {
              type: 'session_expired',
              deviceId: session.deviceId,
              userId: session.userId,
              sessionId: session.id,
              bottlesProcessed: bottleRecords.length,
              timestamp: new Date().toISOString(),
            });
          }

        } catch (error) {
          console.error(`❌ Error processing session ${session.id}:`, error.message);
        }
      }

      console.log(`✅ Cleanup completed:`);
      console.log(`   - Sessions finalized: ${totalSessionsFinalized}`);
      console.log(`   - Transactions created: ${totalTransactionsCreated}`);
      console.log(`   - Bottles processed: ${totalBottlesProcessed}`);

      return {
        success: true,
        sessionsFinalized: totalSessionsFinalized,
        transactionsCreated: totalTransactionsCreated,
        bottlesProcessed: totalBottlesProcessed,
      };
    } catch (error) {
      console.error('❌ Error in session cleanup:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  startAutoCleanup(intervalMinutes = 5) {
    console.log(`🔄 Starting automatic session cleanup (every ${intervalMinutes} minutes)`);
    
    this.finalizeExpiredSessions();
    
    this.cleanupInterval = setInterval(() => {
      this.finalizeExpiredSessions();
    }, intervalMinutes * 60 * 1000);
  }

  stopAutoCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      console.log('🛑 Automatic session cleanup stopped');
    }
  }
}

export default new SessionCleanupService();
