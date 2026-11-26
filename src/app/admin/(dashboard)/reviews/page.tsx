import prisma from '@/lib/prisma';
import ReviewTable from '@/components/admin/ReviewTable';

export const dynamic = 'force-dynamic';

import { getTranslations } from 'next-intl/server';
import AdminPagination from '@/components/admin/AdminPagination';

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const t = await getTranslations('AdminReviews');
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || '1', 10);
  const limit = 20;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      skip,
      take: limit,
      include: {
        product: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.review.count()
  ]);

  const reviewerEmails = Array.from(
    new Set(
      reviews
        .map((r) => r.reviewerEmail || r.user?.email)
        .filter((e): e is string => Boolean(e))
        .map((e) => e.toLowerCase().trim())
    )
  );

  const userIds = Array.from(
    new Set(reviews.map((r) => r.userId).filter((id): id is string => Boolean(id)))
  );

  const paidStatuses: ('PAID' | 'PROCESSING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'AT_PICKUP_POINT')[] = [
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'IN_TRANSIT',
    'DELIVERED',
    'AT_PICKUP_POINT',
  ];

  const paidOrders = (reviewerEmails.length > 0 || userIds.length > 0)
    ? await prisma.order.findMany({
        where: {
          status: { in: paidStatuses },
          OR: [
            ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
            ...(reviewerEmails.length > 0 ? [{ user: { email: { in: reviewerEmails } } }] : [])
          ]
        },
        select: {
          id: true,
          userId: true,
          status: true,
          total: true,
          createdAt: true,
          user: { select: { email: true } },
          orderItems: { select: { productId: true } }
        }
      })
    : [];

  const reviewsWithPurchaseInfo = reviews.map((review) => {
    const email = (review.reviewerEmail || review.user?.email || '').toLowerCase().trim();
    const matchingOrders = paidOrders.filter((o) =>
      (review.userId && o.userId === review.userId) ||
      (email && o.user?.email?.toLowerCase().trim() === email)
    );

    const productPaidOrder = matchingOrders.find((o) =>
      o.orderItems.some((item) => item.productId === review.productId)
    );

    const primaryOrder = productPaidOrder || matchingOrders[0] || null;

    return {
      ...review,
      purchaseInfo: {
        hasPaidOrder: matchingOrders.length > 0,
        hasBoughtThisProduct: Boolean(productPaidOrder),
        orderId: primaryOrder?.id || null,
        orderTotal: primaryOrder?.total || null,
        orderStatus: primaryOrder?.status || null,
        orderCount: matchingOrders.length,
      }
    };
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <ReviewTable reviews={reviewsWithPurchaseInfo as any} />
      </div>
      <AdminPagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
