'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getDestinations() {
  try {
    const destinations = await db.destination.findMany({
      include: {
        country: true,
        _count: {
          select: { themePOIs: true }
        }
      },
      orderBy: { cityName: 'asc' }
    })

    return { success: true, data: destinations }
  } catch (error) {
    return { success: false, error: 'Failed to fetch destinations' }
  }
}

export async function getDestinationWithPOIs(id: string) {
  try {
    const destination = await db.destination.findUnique({
      where: { id },
      include: {
        country: true,
        themePOIs: {
          orderBy: [{ theme: 'asc' }, { displayOrder: 'asc' }]
        }
      }
    })

    if (!destination) {
      return { success: false, error: 'Destination not found' }
    }

    return { success: true, data: destination }
  } catch (error) {
    return { success: false, error: 'Failed to fetch destination' }
  }
}
