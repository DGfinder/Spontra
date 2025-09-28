import { NextResponse } from "next/server";
import { amadeusClient } from "@/lib/amadeusSimple";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { offerSnapshot, providerId } = body;

    if (!offerSnapshot?.rawAmadeusOffer) {
      return NextResponse.json({ 
        status: "ERROR", 
        message: "Missing offer data for repricing" 
      }, { status: 400 });
    }

    // Call Amadeus pricing to revalidate
    const priced = await amadeusClient.priceOffer({ 
      offer: offerSnapshot.rawAmadeusOffer 
    });

    const oldTotal = Number(offerSnapshot.price);
    const newTotal = Number(priced.price.total);
    const currency = priced.price.currency;

    if (!priced.available) {
      // Log price accuracy event
      await prisma.priceAccuracy.create({
        data: {
          providerId: providerId || "amadeus",
          offerId: offerSnapshot.id,
          originalPrice: oldTotal,
          repricedPrice: null,
          currency,
          priceChanged: true,
          percentageChange: 100, // 100% change = unavailable
          checkType: "on_select"
        }
      }).catch(console.warn);

      return NextResponse.json({ status: "UNAVAILABLE" }, { status: 409 });
    }

    const priceChangeThreshold = 0.01; // 1 cent threshold
    const priceChanged = Math.abs(newTotal - oldTotal) > priceChangeThreshold;
    const percentageChange = oldTotal > 0 ? ((newTotal - oldTotal) / oldTotal) * 100 : 0;

    // Log price accuracy event
    await prisma.priceAccuracy.create({
      data: {
        providerId: providerId || "amadeus",
        offerId: offerSnapshot.id,
        originalPrice: oldTotal,
        repricedPrice: newTotal,
        currency,
        priceChanged,
        percentageChange,
        checkType: "on_select"
      }
    }).catch(console.warn);

    if (priceChanged) {
      return NextResponse.json({ 
        status: "CHANGED", 
        newPrice: newTotal, 
        oldPrice: oldTotal,
        currency,
        percentageChange: Math.round(percentageChange * 100) / 100
      });
    }

    return NextResponse.json({ 
      status: "OK", 
      price: newTotal, 
      currency 
    });

  } catch (e: any) {
    console.error("[/api/reprice] Error:", e);
    
    // Log failed reprice attempt
    if (body?.offerSnapshot?.id && body?.providerId) {
      await prisma.priceAccuracy.create({
        data: {
          providerId: body.providerId || "amadeus",
          offerId: body.offerSnapshot.id,
          originalPrice: Number(body.offerSnapshot?.price || 0),
          repricedPrice: null,
          currency: body.offerSnapshot?.currency || "EUR",
          priceChanged: true,
          percentageChange: null,
          checkType: "on_select"
        }
      }).catch(console.warn);
    }

    return NextResponse.json({ 
      status: "ERROR", 
      message: e?.message ?? "reprice_failed" 
    }, { status: 500 });
  }
}