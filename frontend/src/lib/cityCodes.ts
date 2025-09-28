export type CityGroup = { city: string; airports: string[] };

export const CITY_GROUPS: CityGroup[] = [
  { city: "LON", airports: ["LHR", "LGW", "LCY", "LTN", "STN", "SEN"] },
  { city: "NYC", airports: ["JFK", "LGA", "EWR", "ISP", "HPN", "SWF"] },
  { city: "OSA", airports: ["KIX", "ITM"] },
  { city: "TYO", airports: ["HND", "NRT"] },
  { city: "MIL", airports: ["MXP", "LIN", "BGY"] },
  // Add more by market (PAR, ROM, BUE, RIO…) when you expand
];

const airportToCity = new Map<string,string>();
for (const g of CITY_GROUPS) for (const a of g.airports) airportToCity.set(a, g.city);

/** If input is an airport, return its city-code; if already a city-code, keep it. */
export function toCityCode(code: string): string {
  const up = code.toUpperCase();
  const city = CITY_GROUPS.find(g => g.city === up);
  if (city) return up;
  return airportToCity.get(up) ?? up;
}

/** Expand a city-code to all airports (for Amadeus multi-search); fall back to the code itself. */
export function expandCity(code: string): string[] {
  const up = code.toUpperCase();
  const g = CITY_GROUPS.find(c => c.city === up);
  return g ? g.airports : [up];
}