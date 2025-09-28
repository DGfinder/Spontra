import { buildDeeplink, fillTemplate } from "./buildDeeplink";

const provider: any = {
  id: "provider-1",
  providerId: "expedia", 
  market: "AU",
  reliabilityScore: 0.9, 
  expectedEPC: 0.45, 
  supportsInfants: true
};

const linkTemplate: any = {
  template: "https://expedia.example/Flights-Search?trip={trip}&leg1=from:{orig},to:{dest},departure:{depDate}&adults={adt}&cabinclass={cabin}&currency={currency}&aff_click_id={clickId}",
  requiredTokens: JSON.stringify(["trip","orig","dest","depDate","adt","cabin","currency","clickId"])
};

const query = {
  origin: "PER", 
  destination: "DAD",
  departDate: "2025-11-01",
  pax: { ADT: 1, CHD: 0, INF_LAP: 0, INF_SEAT: 0 },
  cabin: "ECONOMY" as const, 
  currency: "AUD", 
  locale: "en-AU", 
  market: "AU"
};

describe("fillTemplate", () => {
  test("replaces tokens safely with URL encoding", () => {
    const out = fillTemplate("x={a}&y={b}", { a: "A B", b: 1 });
    expect(out).toBe("x=A%20B&y=1");
  });

  test("handles null/undefined values", () => {
    const out = fillTemplate("x={a}&y={b}", { a: null, b: undefined });
    expect(out).toBe("x=&y=");
  });

  test("handles special characters", () => {
    const out = fillTemplate("q={query}", { query: "test@domain.com&param=value" });
    expect(out).toBe("q=test%40domain.com%26param%3Dvalue");
  });
});

describe("buildDeeplink", () => {
  test("produces a valid URL with UTM and aff_click_id", () => {
    const url = buildDeeplink({ 
      provider, 
      linkTemplate, 
      query, 
      clickId: "CLICK123" 
    });

    expect(url).toContain("utm_source=spontra");
    expect(url).toContain("utm_medium=metasearch");
    expect(url).toContain("utm_campaign=flights");
    expect(url).toContain("aff_click_id=CLICK123");
    expect(url).toContain("from%3APER"); // encoded origin
    expect(url).toContain("to%3ADAD"); // encoded destination
  });

  test("handles roundtrip vs oneway correctly", () => {
    const roundtripQuery = { ...query, returnDate: "2025-11-08" };
    const url = buildDeeplink({ 
      provider, 
      linkTemplate, 
      query: roundtripQuery, 
      clickId: "CLICK123" 
    });
    expect(url).toContain("trip=roundtrip");

    const onewayUrl = buildDeeplink({ 
      provider, 
      linkTemplate, 
      query, 
      clickId: "CLICK123" 
    });
    expect(onewayUrl).toContain("trip=oneway");
  });

  test("includes campaign and placement IDs when provided", () => {
    const url = buildDeeplink({ 
      provider, 
      linkTemplate, 
      query, 
      clickId: "CLICK123",
      campaignId: "CAMP456",
      placementId: "PLACE789"
    });
    expect(url).toContain("campaignId=CAMP456");
    expect(url).toContain("placementId=PLACE789");
  });

  test("handles passenger counts correctly", () => {
    const multiPaxQuery = { 
      ...query, 
      pax: { ADT: 2, CHD: 1, INF_LAP: 1, INF_SEAT: 0 } 
    };
    const url = buildDeeplink({ 
      provider, 
      linkTemplate, 
      query: multiPaxQuery, 
      clickId: "CLICK123" 
    });
    expect(url).toContain("adults=2");
  });

  test("defaults locale and currency when not provided", () => {
    const minimalQuery = {
      origin: "PER",
      destination: "DAD", 
      departDate: "2025-11-01",
      pax: { ADT: 1, CHD: 0, INF_LAP: 0, INF_SEAT: 0 }
    };
    const url = buildDeeplink({ 
      provider, 
      linkTemplate, 
      query: minimalQuery, 
      clickId: "CLICK123" 
    });
    expect(url).toContain("currency=AUD");
    // locale not in this template but would be included if template had {locale}
  });
});

describe("URL validation", () => {
  test("produces valid URL objects", () => {
    const urlString = buildDeeplink({ 
      provider, 
      linkTemplate, 
      query, 
      clickId: "CLICK123" 
    });
    
    // Should not throw when creating URL object
    expect(() => new URL(urlString)).not.toThrow();
    
    const url = new URL(urlString);
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("expedia.example");
  });

  test("preserves existing query parameters from template", () => {
    const templateWithParams = {
      ...linkTemplate,
      template: "https://example.com/search?existing=param&from={orig}&to={dest}&clickId={clickId}"
    };
    
    const url = buildDeeplink({ 
      provider, 
      linkTemplate: templateWithParams, 
      query, 
      clickId: "CLICK123" 
    });
    
    expect(url).toContain("existing=param");
    expect(url).toContain("from=PER");
    expect(url).toContain("utm_source=spontra"); // Should be added
  });
});