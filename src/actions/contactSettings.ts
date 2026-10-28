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
    text: settingsMap.CONTACT_TEXT !== undefined ? settingsMap.CONTACT_TEXT : `En Tant Que Prestataire De Services, Nous Sommes Responsables De Nos Propres\nContent on these pages in accordance with Section 7, Paragraph 1 of the\nGerman Telemedia Act (TMG).\n\nHowever, under Sections 8 to 10 of the TMG, we are not\nobligated to monitor transmitted or stored third-party information or\ninvestigate circumstances indicating illegal activity.\n\nLes Obligations De Retrait Ou De Blocage De L'utilisation D'informations En Vertu\nGeneral legal obligations remain unchanged.`,
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
