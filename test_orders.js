const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    include: { orderItems: true, user: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  console.log(JSON.stringify(orders.map(o => ({
    id: o.id,
    createdAt: o.createdAt,
    status: o.status,
    paymentMethod: o.paymentMethod,
    total: o.total,
    email: o.user?.email,
    stripeSessionId: o.stripeSessionId,
    destinationAddress: o.destinationAddress ? JSON.parse(o.destinationAddress) : null
  })), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

