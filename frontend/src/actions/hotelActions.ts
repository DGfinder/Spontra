'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { Decimal } from '@prisma/client/runtime/library'

export interface HotelFormData {
  name: string
  cityName: string
  countryId?: string
  destinationId?: string
  primaryTheme: string
  description?: string
  address?: string
  pricePerNight?: number
  priceLevel: number
  rating?: number
  mainImageUrl?: string
  imageUrls: string[]
  bookingComUrl?: string
  expediaUrl?: string
  hotelsDotComUrl?: string
  isActive: boolean
}

export async function getHotels() {
  try {
    const hotels = await db.hotel.findMany({
      include: {
        destination: {
          select: {
            id: true,
            cityName: true,
            airportCode: true
          }
        }
      },
      orderBy: [
        { cityName: 'asc' },
        { name: 'asc' }
      ]
    })

    // Convert Decimal to number for serialization
    const serializedHotels = hotels.map(hotel => ({
      ...hotel,
      pricePerNight: hotel.pricePerNight ? Number(hotel.pricePerNight) : null,
      rating: hotel.rating ? Number(hotel.rating) : null
    }))

    return { success: true, data: serializedHotels }
  } catch (error) {
    console.error('[getHotels] Error:', error)
    return { success: false, error: 'Failed to fetch hotels' }
  }
}

export async function getHotelById(id: string) {
  try {
    const hotel = await db.hotel.findUnique({
      where: { id },
      include: {
        destination: {
          select: {
            id: true,
            cityName: true,
            airportCode: true
          }
        }
      }
    })

    if (!hotel) {
      return { success: false, error: 'Hotel not found' }
    }

    // Convert Decimal to number for serialization
    const serializedHotel = {
      ...hotel,
      pricePerNight: hotel.pricePerNight ? Number(hotel.pricePerNight) : null,
      rating: hotel.rating ? Number(hotel.rating) : null
    }

    return { success: true, data: serializedHotel }
  } catch (error) {
    console.error('[getHotelById] Error:', error)
    return { success: false, error: 'Failed to fetch hotel' }
  }
}

export async function createHotel(data: HotelFormData) {
  try {
    const hotel = await db.hotel.create({
      data: {
        name: data.name,
        cityName: data.cityName,
        countryId: data.countryId,
        destinationId: data.destinationId,
        primaryTheme: data.primaryTheme,
        description: data.description,
        address: data.address,
        pricePerNight: data.pricePerNight ? new Decimal(data.pricePerNight) : null,
        priceLevel: data.priceLevel,
        rating: data.rating ? new Decimal(data.rating) : null,
        mainImageUrl: data.mainImageUrl,
        imageUrls: data.imageUrls,
        bookingComUrl: data.bookingComUrl,
        expediaUrl: data.expediaUrl,
        hotelsDotComUrl: data.hotelsDotComUrl,
        isActive: data.isActive
      }
    })

    revalidatePath('/admin/hotels')
    revalidatePath('/hotels')

    return { success: true, data: hotel }
  } catch (error) {
    console.error('[createHotel] Error:', error)
    return { success: false, error: 'Failed to create hotel' }
  }
}

export async function updateHotel(id: string, data: Partial<HotelFormData>) {
  try {
    const updateData: any = { ...data }

    // Convert number fields to Decimal if provided
    if (data.pricePerNight !== undefined) {
      updateData.pricePerNight = data.pricePerNight ? new Decimal(data.pricePerNight) : null
    }
    if (data.rating !== undefined) {
      updateData.rating = data.rating ? new Decimal(data.rating) : null
    }

    const hotel = await db.hotel.update({
      where: { id },
      data: updateData
    })

    revalidatePath('/admin/hotels')
    revalidatePath('/hotels')

    return { success: true, data: hotel }
  } catch (error) {
    console.error('[updateHotel] Error:', error)
    return { success: false, error: 'Failed to update hotel' }
  }
}

export async function deleteHotel(id: string) {
  try {
    await db.hotel.delete({
      where: { id }
    })

    revalidatePath('/admin/hotels')
    revalidatePath('/hotels')

    return { success: true }
  } catch (error) {
    console.error('[deleteHotel] Error:', error)
    return { success: false, error: 'Failed to delete hotel' }
  }
}

export async function toggleHotelActive(id: string) {
  try {
    const hotel = await db.hotel.findUnique({
      where: { id },
      select: { isActive: true }
    })

    if (!hotel) {
      return { success: false, error: 'Hotel not found' }
    }

    const updated = await db.hotel.update({
      where: { id },
      data: { isActive: !hotel.isActive }
    })

    revalidatePath('/admin/hotels')
    revalidatePath('/hotels')

    return { success: true, data: updated }
  } catch (error) {
    console.error('[toggleHotelActive] Error:', error)
    return { success: false, error: 'Failed to toggle hotel status' }
  }
}
