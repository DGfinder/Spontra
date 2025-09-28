import { dedupeOffers, offerKey, type OfferLite } from "./dedupeOffers";

const createOffer = (overrides: Partial<OfferLite>): OfferLite => ({
  offerId: "default-id",
  price: 500,
  currency: "AUD",
  stops: 0,
  durationMin: 320,
  segments: [
    { 
      departIata: "PER", 
      departTs: "2025-11-01T06:00:00", 
      arriveIata: "DAD", 
      arriveTs: "2025-11-01T12:20:00" 
    }
  ],
  ...overrides
});

describe("offerKey", () => {
  test("generates consistent keys for identical itineraries", () => {
    const offer1 = createOffer({ offerId: "A" });
    const offer2 = createOffer({ offerId: "B" }); // Different ID, same itinerary
    
    expect(offerKey(offer1)).toBe(offerKey(offer2));
    expect(offerKey(offer1)).toBe("PER2025-11-01T06:00:00->DAD2025-11-01T12:20:00|stops:0|dur:320");
  });

  test("generates different keys for different times", () => {
    const offer1 = createOffer({});
    const offer2 = createOffer({
      segments: [{
        departIata: "PER", 
        departTs: "2025-11-01T07:00:00", // Different time
        arriveIata: "DAD", 
        arriveTs: "2025-11-01T13:20:00"
      }]
    });
    
    expect(offerKey(offer1)).not.toBe(offerKey(offer2));
  });

  test("generates different keys for different stops", () => {
    const offer1 = createOffer({ stops: 0 });
    const offer2 = createOffer({ stops: 1 });
    
    expect(offerKey(offer1)).not.toBe(offerKey(offer2));
  });

  test("handles multi-segment flights", () => {
    const offer = createOffer({
      stops: 1,
      segments: [
        { departIata: "PER", departTs: "2025-11-01T06:00:00", arriveIata: "SIN", arriveTs: "2025-11-01T11:00:00" },
        { departIata: "SIN", departTs: "2025-11-01T13:00:00", arriveIata: "DAD", arriveTs: "2025-11-01T18:00:00" }
      ]
    });
    
    const key = offerKey(offer);
    expect(key).toContain("PER2025-11-01T06:00:00->SIN2025-11-01T11:00:00");
    expect(key).toContain("SIN2025-11-01T13:00:00->DAD2025-11-01T18:00:00");
    expect(key).toContain("stops:1");
  });
});

describe("dedupeOffers", () => {
  test("keeps cheapest offer per identical itinerary", () => {
    const offers = [
      createOffer({ offerId: "A", price: 500 }),
      createOffer({ offerId: "B", price: 470 }), // Cheaper, same itinerary
      createOffer({ offerId: "C", price: 520 })  // More expensive, same itinerary
    ];
    
    const deduped = dedupeOffers(offers);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].offerId).toBe("B");
    expect(deduped[0].price).toBe(470);
  });

  test("preserves offers with different itineraries", () => {
    const offers = [
      createOffer({ 
        offerId: "A", 
        price: 500,
        segments: [{ departIata: "PER", departTs: "2025-11-01T06:00:00", arriveIata: "DAD", arriveTs: "2025-11-01T12:20:00" }]
      }),
      createOffer({ 
        offerId: "B", 
        price: 600,
        segments: [{ departIata: "PER", departTs: "2025-11-01T08:00:00", arriveIata: "DAD", arriveTs: "2025-11-01T14:20:00" }] // Different time
      }),
      createOffer({ 
        offerId: "C", 
        price: 700,
        stops: 1 // Different number of stops
      })
    ];
    
    const deduped = dedupeOffers(offers);
    expect(deduped).toHaveLength(3); // All different itineraries
    expect(deduped.map(o => o.offerId).sort()).toEqual(["A", "B", "C"]);
  });

  test("handles empty array", () => {
    const deduped = dedupeOffers([]);
    expect(deduped).toEqual([]);
  });

  test("handles single offer", () => {
    const offers = [createOffer({ offerId: "SINGLE", price: 500 })];
    const deduped = dedupeOffers(offers);
    
    expect(deduped).toHaveLength(1);
    expect(deduped[0].offerId).toBe("SINGLE");
  });

  test("preserves offer properties correctly", () => {
    const offers = [
      createOffer({ 
        offerId: "EXPENSIVE", 
        price: 800, 
        currency: "AUD",
        durationMin: 320
      }),
      createOffer({ 
        offerId: "CHEAP", 
        price: 400, 
        currency: "AUD",
        durationMin: 320
      })
    ];
    
    const deduped = dedupeOffers(offers);
    expect(deduped).toHaveLength(1);
    
    const kept = deduped[0];
    expect(kept.offerId).toBe("CHEAP");
    expect(kept.price).toBe(400);
    expect(kept.currency).toBe("AUD");
    expect(kept.durationMin).toBe(320);
    expect(kept.segments).toHaveLength(1);
  });

  test("handles price ties by keeping first occurrence", () => {
    const offers = [
      createOffer({ offerId: "FIRST", price: 500 }),
      createOffer({ offerId: "SECOND", price: 500 }) // Same price, same itinerary
    ];
    
    const deduped = dedupeOffers(offers);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].offerId).toBe("FIRST"); // First one wins in case of tie
  });

  test("real-world scenario with multiple airlines", () => {
    const offers = [
      // Same route, different airlines/prices
      createOffer({ offerId: "QF123", price: 650 }), // Qantas
      createOffer({ offerId: "VA456", price: 620 }), // Virgin (cheaper)
      createOffer({ offerId: "JQ789", price: 580 }), // Jetstar (cheapest)
      
      // Different departure time - should be kept separate
      createOffer({ 
        offerId: "QF234", 
        price: 670,
        segments: [{ departIata: "PER", departTs: "2025-11-01T14:00:00", arriveIata: "DAD", arriveTs: "2025-11-01T20:20:00" }]
      }),
      
      // Connection flight - different itinerary due to stops
      createOffer({ 
        offerId: "SQ999", 
        price: 550, 
        stops: 1,
        segments: [
          { departIata: "PER", departTs: "2025-11-01T06:00:00", arriveIata: "SIN", arriveTs: "2025-11-01T11:00:00" },
          { departIata: "SIN", departTs: "2025-11-01T13:00:00", arriveIata: "DAD", arriveTs: "2025-11-01T18:00:00" }
        ]
      })
    ];
    
    const deduped = dedupeOffers(offers);
    expect(deduped).toHaveLength(3); // 3 different itineraries
    
    // Should keep JQ789 (cheapest direct), QF234 (different time), SQ999 (connection)
    const keptIds = deduped.map(o => o.offerId).sort();
    expect(keptIds).toEqual(["JQ789", "QF234", "SQ999"]);
  });
});