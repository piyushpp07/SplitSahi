import { getDashboardTotals } from '/Users/piyushparadkar/sahisplit/backend/src/services/balance.js';
import { prisma } from '/Users/piyushparadkar/sahisplit/backend/src/lib/prisma.js';

async function main() {
    const userId = 'cmle01k2n0000r5lmzkwkr8cj'; // Piyush's ID
    const groupId = 'cmle16uf2000ee9bq2ayq531b';
    const totals = await getDashboardTotals(userId, groupId);
    console.log('--- DASHBOARD TOTALS ---');
    console.log(JSON.stringify(totals, null, 2));

    // Enrichment logic like in the route
    const transactions = totals.simplifiedTransactions;
    const userIds = new Set<string>();
    for (const t of transactions) {
        userIds.add(t.fromUserId);
        userIds.add(t.toUserId);
    }
    const users = await prisma.user.findMany({
        where: { id: { in: Array.from(userIds) } },
        select: { id: true, name: true, upiId: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    const enriched = transactions.map((t) => ({
        ...t,
        fromUser: userMap.get(t.fromUserId),
        toUser: userMap.get(t.toUserId),
    }));
    console.log('--- ENRICHED TRANSACTIONS ---');
    console.log(JSON.stringify(enriched, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
