import { URL } from "node:url";
import type { LinkTemplate, Provider } from "@prisma/client";

export type NormalizedQuery = {
  origin: string; destination: string;
  departDate: string; returnDate?: string;
  pax: { ADT: number; CHD: number; INF_LAP: number; INF_SEAT: number };
  cabin?: "ECONOMY"|"PREMIUM_ECONOMY"|"BUSINESS"|"FIRST";
  locale?: string; currency?: string; market?: string;
};

export function fillTemplate(
  template: string,
  tokens: Record<string, string|number|undefined|null>
): string {
  let out = template;
  Object.entries(tokens).forEach(([k, v]) => {
    out = out.replaceAll(`{${k}}`, encodeURIComponent(v == null ? "" : String(v)));
  });
  return out;
}

export function buildDeeplink(params: {
  provider: Provider;
  linkTemplate: LinkTemplate;
  query: NormalizedQuery;
  clickId: string;
  campaignId?: string;
  placementId?: string;
}) {
  const { provider, linkTemplate, query, clickId, campaignId, placementId } = params;

  const tokenMap = {
    trip: query.returnDate ? "roundtrip" : "oneway",
    orig: query.origin, dest: query.destination,
    depDate: query.departDate, retDate: query.returnDate ?? "",
    adt: query.pax.ADT, chd: query.pax.CHD, infLap: query.pax.INF_LAP, infSeat: query.pax.INF_SEAT,
    cabin: query.cabin ?? "ECONOMY",
    locale: query.locale ?? "en-AU",
    currency: query.currency ?? "AUD",
    clickId, campaignId: campaignId ?? "", placementId: placementId ?? ""
  };

  let url = fillTemplate(linkTemplate.template, tokenMap);

  // Always append UTM + a generic affiliate click param if supported
  const u = new URL(url);
  u.searchParams.set("utm_source", "spontra");
  u.searchParams.set("utm_medium", "metasearch");
  u.searchParams.set("utm_campaign", "flights");
  // Many networks accept one of these; template should include the canonical one but this is a safe fallback:
  if (!u.searchParams.has("aff_click_id")) u.searchParams.set("aff_click_id", clickId);
  
  // Add campaign and placement IDs as query params for tracking
  if (campaignId && !u.searchParams.has("campaignId")) {
    u.searchParams.set("campaignId", campaignId);
  }
  if (placementId && !u.searchParams.has("placementId")) {
    u.searchParams.set("placementId", placementId);
  }

  return u.toString();
}