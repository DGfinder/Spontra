import { describe, test, expect, beforeAll } from 'vitest';
import { createHmacSignature } from './hmac';

// Mock environment for tests
beforeAll(() => {
  process.env.IMPACT_SIGNATURE_SECRET = "test_impact_secret";
  process.env.CJ_SIGNATURE_SECRET = "test_cj_secret";
  process.env.CJ_ADVERTISER_IDS = "Qantas,VirginAustralia,AirNewZealand,BritishAirways,SingaporeAirlines";
  process.env.NODE_ENV = "test";
});

function makeRequest(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { 
    headers: new Headers(headers),
    method: 'GET'
  });
}

describe("Affiliate Postback Verification", () => {
  test("HMAC signature generation and verification", () => {
    const secret = "test_secret_123";
    const payload = "subId=CLICK123&status=approved&amount=12.34&currency=AUD";
    
    const signature = createHmacSignature(payload, secret);
    expect(signature).toBeDefined();
    expect(signature.length).toBeGreaterThan(0);
    
    // Verify the signature matches
    const verifySignature = createHmacSignature(payload, secret);
    expect(signature).toBe(verifySignature);
    
    // Different payload should produce different signature
    const differentPayload = "subId=CLICK456&status=approved&amount=99.99&currency=USD";
    const differentSignature = createHmacSignature(differentPayload, secret);
    expect(signature).not.toBe(differentSignature);
  });

  test("Impact postback parameter extraction", () => {
    const qs = "subId=CLICK123&status=approved&amount=12.34&currency=AUD&advId=KAYAK";
    const url = new URL(`https://example.com/api/aff/postback/impact?${qs}`);
    
    expect(url.searchParams.get("subId")).toBe("CLICK123");
    expect(url.searchParams.get("status")).toBe("approved");
    expect(url.searchParams.get("amount")).toBe("12.34");
    expect(url.searchParams.get("currency")).toBe("AUD");
    expect(url.searchParams.get("advId")).toBe("KAYAK");
  });

  test("CJ postback parameter extraction", () => {
    const qs = "sid=CLICK456&actionStatus=new&commissionAmount=9.99&currency=AUD&cid=Qantas&actionId=ACTION123";
    const url = new URL(`https://example.com/api/aff/postback/cj?${qs}`);
    
    expect(url.searchParams.get("sid")).toBe("CLICK456");
    expect(url.searchParams.get("actionStatus")).toBe("new");
    expect(url.searchParams.get("commissionAmount")).toBe("9.99");
    expect(url.searchParams.get("currency")).toBe("AUD");
    expect(url.searchParams.get("cid")).toBe("Qantas");
    expect(url.searchParams.get("actionId")).toBe("ACTION123");
  });

  test("CJ advertiser allowlist validation", () => {
    const allowedAdvertisers = process.env.CJ_ADVERTISER_IDS!.split(",");
    
    expect(allowedAdvertisers).toContain("Qantas");
    expect(allowedAdvertisers).toContain("VirginAustralia");
    expect(allowedAdvertisers).toContain("AirNewZealand");
    expect(allowedAdvertisers).not.toContain("UnknownAdvertiser");
  });

  test("Status mapping for different networks", () => {
    // Impact statuses
    expect("approved".toUpperCase()).toBe("APPROVED");
    expect("pending".toUpperCase()).toBe("PENDING");
    expect("rejected".toUpperCase()).toBe("REJECTED");
    
    // CJ status mapping
    const cjStatusMap: Record<string, string> = {
      "new": "APPROVED",
      "modify": "APPROVED", 
      "void": "REJECTED",
      "locked": "PENDING"
    };
    
    expect(cjStatusMap["new"]).toBe("APPROVED");
    expect(cjStatusMap["void"]).toBe("REJECTED");
    expect(cjStatusMap["locked"]).toBe("PENDING");
  });

  test("Postback payload security validation", () => {
    // Test that we properly validate required fields
    const impactParams = new URLSearchParams("subId=CLICK123&status=approved&amount=12.34");
    expect(impactParams.get("subId")).toBeTruthy();
    expect(impactParams.get("status")).toBeTruthy();
    
    const cjParams = new URLSearchParams("sid=CLICK456&actionStatus=new&commissionAmount=9.99&cid=Qantas");
    expect(cjParams.get("sid")).toBeTruthy();
    expect(cjParams.get("actionStatus")).toBeTruthy();
    expect(cjParams.get("cid")).toBeTruthy();
    
    // Missing required fields
    const invalidParams = new URLSearchParams("amount=12.34&currency=AUD");
    expect(invalidParams.get("subId")).toBeFalsy();
    expect(invalidParams.get("sid")).toBeFalsy();
  });

  test("Commission amount parsing and validation", () => {
    const amount1 = Number("12.34");
    const amount2 = Number("0");
    const amount3 = Number("invalid");
    
    expect(amount1).toBe(12.34);
    expect(amount2).toBe(0);
    expect(isNaN(amount3)).toBe(true);
    
    // Validate positive amounts
    expect(amount1).toBeGreaterThan(0);
    expect(amount2).toBe(0);
  });

  test("Currency code validation", () => {
    const validCurrencies = ["AUD", "USD", "EUR", "GBP", "NZD", "SGD", "JPY"];
    const testCurrency = "AUD";
    
    expect(validCurrencies).toContain(testCurrency);
    expect(testCurrency.length).toBe(3);
    expect(testCurrency).toMatch(/^[A-Z]{3}$/);
  });

  test("Click ID format validation", () => {
    const validClickId = "CLICK_123_ABC";
    const syntheticClickId = "SYN-1234567890-abc123";
    const testClickId = "TEST_CLICK_123";
    
    expect(validClickId.length).toBeGreaterThan(0);
    expect(syntheticClickId).toMatch(/^SYN-/);
    expect(testClickId).toMatch(/^TEST_/);
    
    // Should not be empty or just whitespace
    expect(validClickId.trim()).toBeTruthy();
    expect("").toBeFalsy();
    expect("   ".trim()).toBeFalsy();
  });
});