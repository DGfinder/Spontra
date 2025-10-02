'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getCountries() {
  try {
    const countries = await db.country.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { destinations: true }
        }
      }
    })

    return { success: true, data: countries }
  } catch (error) {
    return { success: false, error: 'Failed to fetch countries' }
  }
}

export async function createCountry(data: { name: string; code: string }) {
  try {
    const country = await db.country.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase()
      }
    })

    revalidatePath('/admin/countries')
    return { success: true, data: country }
  } catch (error) {
    return { success: false, error: 'Failed to create country' }
  }
}

export async function updateCountry(id: string, data: { name: string; code: string }) {
  try {
    const country = await db.country.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code.toUpperCase()
      }
    })

    revalidatePath('/admin/countries')
    return { success: true, data: country }
  } catch (error) {
    return { success: false, error: 'Failed to update country' }
  }
}

export async function deleteCountry(id: string) {
  try {
    await db.country.delete({
      where: { id }
    })

    revalidatePath('/admin/countries')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete country. It may have destinations linked to it.' }
  }
}
