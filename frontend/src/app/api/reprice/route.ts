import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { isFeatureEnabled } from "@/lib/featureFlags";

export async function POST(req: Request) {
  try {
    // Check if reprice feature is enabled
    if (!isFeatureEnabled('REPRICE_ON_SELECT_ENABLED')) {
      // Feature disabled - return OK without repricing
      const body = await req.json();
      return NextResponse.json({
        status: "OK",
        price: body.offerSnapshot?.price || 0,
        currency: body.offerSnapshot?.currency || "EUR",
        message: "Repricing disabled"
      });
    }

    const body = await req.json();
    const { offerSnapshot, providerId } = body;

    if (!offerSnapshot?.rawAmadeusOffer) {
      return NextResponse.json({
        status: "ERROR",
        message: "Missing offer data for repricing"
      }, { status: 400 });
    }

    // TODO: Implement Amadeus Flight Offers Price API
    // Endpoint: POST /v2/shopping/flight-offers/pricing
    // For now, return OK without repricing since feature is disabled by default
    return NextResponse.json({
      status: "OK",
      price: offerSnapshot.price,
      currency: offerSnapshot.currency || "EUR",
      message: "Repricing not yet implemented"
    });

  } catch (e: any) {
    console.error("[/api/reprice] Error:", e);

    return NextResponse.json({
      status: "ERROR",
      message: e?.message ?? "reprice_failed"
    }, { status: 500 });
  }
}