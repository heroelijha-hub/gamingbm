'use server';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getContactSettings() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'CONTACT_TITLE',
          'CONTACT_TEXT',
          'CONTACT_SLUG',
          'CONTACT_ADDRESS',
          'CONTACT_PHONE',
          'CONTACT_EMAIL_DISPLAY',
          'CONTACT_FORM_RECIPIENT',
          'CONTACT_BOTTOM_TEXT',
          'CONTACT_PHONE_PLACEHOLDER'
        ]
      }
    }
  });

  const settingsMap = settings.reduce((acc: any, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  return {
    title: settingsMap.CONTACT_TITLE !== undefined ? settingsMap.CONTACT_TITLE : 'Content Responsibility',
    slug: settingsMap.CONTACT_SLUG !== undefined ? settingsMap.CONTACT_SLUG : 'contact',
    text: settingsMap.CONTACT_TEXT !== undefined ? settingsMap.CONTACT_TEXT : `Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.\n\nNach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.\n\nVerpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.`,
    address: settingsMap.CONTACT_ADDRESS !== undefined ? settingsMap.CONTACT_ADDRESS : 'Chaussée de Tirlemont 110, 5030 Gembloux, BELGIQUE\nLondon, UK',
    phone: settingsMap.CONTACT_PHONE !== undefined ? settingsMap.CONTACT_PHONE : '+32456761781',
    emailDisplay: settingsMap.CONTACT_EMAIL_DISPLAY !== undefined ? settingsMap.CONTACT_EMAIL_DISPLAY : 'info@gamingbm.com',
    formRecipient: settingsMap.CONTACT_FORM_RECIPIENT || 'info@gamingbm.com',
    bottomText: settingsMap.CONTACT_BOTTOM_TEXT !== undefined ? settingsMap.CONTACT_BOTTOM_TEXT : '',
    phonePlaceholder: settingsMap.CONTACT_PHONE_PLACEHOLDER !== undefined ? settingsMap.CONTACT_PHONE_PLACEHOLDER : '+32 XXX .....'
  };
}

export async function updateContactSettings(data: {
  title: string;
  slug: string;
  text: string;
  address: string;
  phone: string;
  emailDisplay: string;
  formRecipient: string;
  bottomText: string;
  phonePlaceholder: string;
}) {
  await requireAdmin();

  try {
    const keys = [
      { key: 'CONTACT_TITLE', value: data.title },
      { key: 'CONTACT_SLUG', value: data.slug },
      { key: 'CONTACT_TEXT', value: data.text },
      { key: 'CONTACT_ADDRESS', value: data.address },
      { key: 'CONTACT_PHONE', value: data.phone },
      { key: 'CONTACT_EMAIL_DISPLAY', value: data.emailDisplay },
      { key: 'CONTACT_FORM_RECIPIENT', value: data.formRecipient },
      { key: 'CONTACT_BOTTOM_TEXT', value: data.bottomText },
      { key: 'CONTACT_PHONE_PLACEHOLDER', value: data.phonePlaceholder }
    ];

    for (const item of keys) {
      await prisma.setting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value }
      });
    }

    revalidatePath('/contact');
    revalidatePath('/admin/pages/contact');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating contact settings:', error);
    return { error: 'Failed to update contact settings' };
  }
}
