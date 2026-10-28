'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

// Internal helper to geocode (City, Country) -> Lat, Lng via Nominatim
async function geocodeCity(city: string, country: string): Promise<{ lat: number, lng: number } | null> {
  const query = encodeURIComponent(`${city}, ${country}`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Gaming BM-Tracking-System/1.0',
      },
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data && data.length > 0 && data[0].lat && data[0].lon) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// Update basic delivery information (Origin, Destination, Tracking)
export async function updateOrderTracking(
  orderId: string, 
  trackingNumber: string, 
  originCity: string, 
  originCountry: string, 
  destinationAddress: string, 
  destinationCountry: string
) {
  await requireAdmin();
  let originLat: number | null = null;
  let originLng: number | null = null;
  let destinationLat: number | null = null;
  let destinationLng: number | null = null;

  // Geocode Origin
  if (originCity && originCountry) {
    const originCoords = await geocodeCity(originCity, originCountry);
    if (originCoords) {
      originLat = originCoords.lat;
      originLng = originCoords.lng;
    }
  }

  // Geocode Destination
  if (destinationAddress && destinationCountry) {
    const destCoords = await geocodeCity(destinationAddress, destinationCountry);
    if (destCoords) {
      destinationLat = destCoords.lat;
      destinationLng = destCoords.lng;
    }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      trackingNumber: trackingNumber || null,
      originCity,
      originCountry,
      originLat,
      originLng,
      destinationAddress,
      destinationCountry,
      destinationLat,
      destinationLng
    }
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/tracking');
}

// Add a new delivery position to the history
export async function addDeliveryPosition(orderId: string, city: string, country: string, note?: string) {
  await requireAdmin();
  const coords = await geocodeCity(city, country);
  
  if (!coords) {
    throw new Error(`Unable to find coordinates for ${city}, ${country}`);
  }

  await prisma.deliveryPosition.create({
    data: {
      orderId,
      city,
      country,
      latitude: coords.lat,
      longitude: coords.lng,
      note: note || null
    }
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/tracking');
}

// Supprimer une position
export async function deleteDeliveryPosition(positionId: string, orderId: string) {
  await requireAdmin();
  await prisma.deliveryPosition.delete({
    where: { id: positionId }
  });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/tracking');
}

// Activer le mode "En Préparation" avec délai automatique
export async function activatePreparation(orderId: string, deliveryDays: number) {
  await requireAdmin();
  await prisma.order.update({
    where: { id: orderId },
    data: {
      preparationStartedAt: new Date(),
      deliveryDays,
      status: 'PROCESSING',
      delayNote: null, // reset any previous delay note
    }
  });
  revalidatePath(`/admin/orders/${orderId}`);
}

// Annuler le mode automatique (réinitialiser)
export async function cancelPreparation(orderId: string) {
  await requireAdmin();
  await prisma.order.update({
    where: { id: orderId },
    data: {
      preparationStartedAt: null,
      deliveryDays: null,
      delayNote: null,
      status: 'PAID',
    }
  });
  revalidatePath(`/admin/orders/${orderId}`);
}

// Ajouter une note de contretemps (bascule en mode manuel)
export async function addDelayNote(orderId: string, note: string) {
  await requireAdmin();
  await prisma.order.update({
    where: { id: orderId },
    data: { delayNote: note }
  });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/order-tracking');
}
