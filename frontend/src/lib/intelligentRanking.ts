export type OfferLite = {
  offerId: string;
  price: number;        // total in user currency
  durationMin: number;  // total minutes
  stops: number;
  baggageIncluded?: boolean;
  providerCandidates: Array<{
    providerId: string;
    reliabilityScore: number;   // 0..1 (from synthetic + price accuracy)
    expectedEPC: number;        // $ per click
    airlineDirect?: boolean;
  }>;
};

export type RankConfig = {
  airlineDirectBias?: boolean;       // prefer direct when tie
  reliabilityWeight?: number;        // default .30
  revenueWeight?: number;            // default .20
  valueWeight?: number;              // default .50
  maxProvidersPerOffer?: number;     // cap shown providers
};

function zscore(x: number, mean: number, std: number) {
  if (std === 0) return 0;
  return (x - mean) / std;
}

export function rankOffers(offers: OfferLite[], cfg: RankConfig = {}) {
  const valueW = cfg.valueWeight ?? 0.50;
  const relW = cfg.reliabilityWeight ?? 0.30;
  const revW = cfg.revenueWeight ?? 0.20;

  const prices = offers.map(o => o.price);
  const durations = offers.map(o => o.durationMin);
  const meanP = prices.reduce((a,b)=>a+b,0)/Math.max(prices.length,1);
  const meanD = durations.reduce((a,b)=>a+b,0)/Math.max(durations.length,1);
  const stdP = Math.sqrt(prices.reduce((s,p)=>s+(p-meanP)**2,0)/Math.max(prices.length,1));
  const stdD = Math.sqrt(durations.reduce((s,d)=>s+(d-meanD)**2,0)/Math.max(durations.length,1));

  const scored = offers.map(o => {
    const valueScore =
      -zscore(o.price, meanP, stdP) + // cheaper is better
      -zscore(o.durationMin, meanD, stdD) +
      (o.stops === 0 ? 0.2 : o.stops === 1 ? 0 : -0.2) +
      (o.baggageIncluded ? 0.1 : 0);

    // Provider-level blend: take best provider score for this offer
    let bestProviderScore = -Infinity;
    let bestProviders = o.providerCandidates
      .sort((a,b) => (b.expectedEPC + b.reliabilityScore) - (a.expectedEPC + a.reliabilityScore))
      .slice(0, cfg.maxProvidersPerOffer ?? 3);

    for (const p of bestProviders) {
      const relScore = p.reliabilityScore;           // already 0..1
      const revScore = Math.min(p.expectedEPC / 1.0, 1.0); // normalize with $1 EPC cap
      let combo = valueW * valueScore + relW * relScore + revW * revScore;
      if (cfg.airlineDirectBias && p.airlineDirect) combo += 0.05;
      bestProviderScore = Math.max(bestProviderScore, combo);
    }

    return { offer: o, score: bestProviderScore, providersShown: bestProviders };
  });

  scored.sort((a,b) => b.score - a.score);
  return scored;
}