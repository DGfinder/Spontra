export type Segment = {
  departIata: string; arriveIata: string;
  departTs: string; arriveTs: string;
};

export type OfferLite = {
  offerId: string;
  price: number;
  currency: string;
  stops: number;
  durationMin: number;
  segments: Segment[];
};

export function offerKey(o: OfferLite) {
  const s = o.segments.map(seg =>
    `${seg.departIata}${seg.departTs}->${seg.arriveIata}${seg.arriveTs}`
  ).join("|");
  return `${s}|stops:${o.stops}|dur:${o.durationMin}`;
}

/** Keep the cheapest per itinerary key. */
export function dedupeOffers(offers: OfferLite[]) {
  const map = new Map<string, OfferLite>();
  for (const o of offers) {
    const k = offerKey(o);
    const cur = map.get(k);
    if (!cur || o.price < cur.price) map.set(k, o);
  }
  return [...map.values()];
}