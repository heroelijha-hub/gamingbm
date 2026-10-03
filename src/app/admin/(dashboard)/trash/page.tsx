import TrashPageClient from './TrashPageClient';
import { getTranslations } from 'next-intl/server';
import { getTrashedProducts, getTrashedMedia } from '@/actions/trash';

export async function generateMetadata() {
  const t = await getTranslations('AdminTrash');
  return {
    title: `${t('title')} | Top Kaminbrennstoffe Admin`,
  };
}

export default async function TrashPage() {
  const trashedProducts = await getTrashedProducts();
  const trashedMedia = await getTrashedMedia();

  return (
    <TrashPageClient 
      initialProducts={trashedProducts} 
      initialMedia={trashedMedia} 
    />
  );
}
