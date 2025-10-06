'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getDestinationPOIs(destinationId: string) {
  try {
    const pois = await db.themePOI.findMany({
      where: { destinationId },
      orderBy: [{ theme: 'asc' }, { displayOrder: 'asc' }]
    })

    return { success: true, data: pois }
  } catch (error) {
    return { success: false, error: 'Failed to fetch POIs' }
  }
}

export async function createPOI(data: {
  destinationId: string
  theme: string
  name: string
  description?: string
  videoUrl?: string
  latitude?: number
  longitude?: number
  caption?: string
  altText?: string
  instagramUrl?: string
}) {
  try {
    // Get the highest display order for this theme
    const lastPOI = await db.themePOI.findFirst({
      where: {
        destinationId: data.destinationId,
        theme: data.theme
      },
      orderBy: { displayOrder: 'desc' }
    })

    const poi = await db.themePOI.create({
      data: {
        ...data,
        displayOrder: (lastPOI?.displayOrder ?? -1) + 1
      }
    })

    revalidatePath('/admin/destinations')
    return { success: true, data: poi }
  } catch (error) {
    return { success: false, error: 'Failed to create POI' }
  }
}

export async function updatePOI(id: string, data: {
  name: string
  description?: string
  videoUrl?: string
  latitude?: number
  longitude?: number
  caption?: string
  altText?: string
  instagramUrl?: string
}) {
  try {
    const poi = await db.themePOI.update({
      where: { id },
      data
    })

    revalidatePath('/admin/destinations')
    return { success: true, data: poi }
  } catch (error) {
    return { success: false, error: 'Failed to update POI' }
  }
}

export async function deletePOI(id: string) {
  try {
    await db.themePOI.delete({
      where: { id }
    })

    revalidatePath('/admin/destinations')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete POI' }
  }
}

export async function reorderPOI(id: string, direction: 'up' | 'down') {
  try {
    const poi = await db.themePOI.findUnique({
      where: { id }
    })

    if (!poi) {
      return { success: false, error: 'POI not found' }
    }

    // Find the POI to swap with
    const swapWith = await db.themePOI.findFirst({
      where: {
        destinationId: poi.destinationId,
        theme: poi.theme,
        displayOrder: direction === 'up' ? { lt: poi.displayOrder } : { gt: poi.displayOrder }
      },
      orderBy: { displayOrder: direction === 'up' ? 'desc' : 'asc' }
    })

    if (!swapWith) {
      return { success: false, error: 'Cannot move POI in that direction' }
    }

    // Swap display orders
    await db.$transaction([
      db.themePOI.update({
        where: { id: poi.id },
        data: { displayOrder: swapWith.displayOrder }
      }),
      db.themePOI.update({
        where: { id: swapWith.id },
        data: { displayOrder: poi.displayOrder }
      })
    ])

    revalidatePath('/admin/destinations')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to reorder POI' }
  }
}
