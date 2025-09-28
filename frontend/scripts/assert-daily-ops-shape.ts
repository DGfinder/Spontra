#!/usr/bin/env tsx
/**
 * Daily Ops API Shape Assertion Test
 * 
 * Prevents breaking changes to critical dashboard JSON structure
 * Run in CI to catch field renames or missing data
 */

import assert from "node:assert";

async function main() {
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) {
    console.error("❌ ADMIN_API_KEY environment variable required");
    process.exit(1);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/admin/dashboards/daily-ops`;

  console.log(`🔍 Testing daily ops API shape: ${url}`);

  try {
    const res = await fetch(url, {
      headers: { "x-api-key": apiKey }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();

    // Assert top-level structure
    assert(typeof json === "object", "Response should be an object");
    assert(Array.isArray(json.epcByProviderMarket), "epcByProviderMarket should be an array");
    assert(Array.isArray(json.priceChangeRates), "priceChangeRates should be an array");
    assert(Array.isArray(json.syntheticFailures15m), "syntheticFailures15m should be an array");
    assert(typeof json.landedRate24h === "object", "landedRate24h should be an object");
    assert(typeof json.summary === "object", "summary should be an object");
    assert(typeof json.generatedAt === "string", "generatedAt should be a string");

    // Assert EPC structure (if data exists)
    if (json.epcByProviderMarket.length > 0) {
      const epcFields = ["providerId", "market", "epc24h", "epc7d", "changePctVs7d", "status", "action"];
      const firstEpc = json.epcByProviderMarket[0];
      epcFields.forEach(field => {
        assert(field in firstEpc, `EPC record missing field: ${field}`);
      });
      
      // Assert numeric fields are actually numbers
      assert(typeof firstEpc.epc24h === "number", "epc24h should be a number");
      assert(typeof firstEpc.epc7d === "number", "epc7d should be a number");
      assert(typeof firstEpc.changePctVs7d === "number", "changePctVs7d should be a number");
    }

    // Assert price change structure (if data exists)
    if (json.priceChangeRates.length > 0) {
      const priceFields = ["providerId", "checks", "changed", "pctChanged", "status", "action"];
      const firstPrice = json.priceChangeRates[0];
      priceFields.forEach(field => {
        assert(field in firstPrice, `Price record missing field: ${field}`);
      });
      
      assert(typeof firstPrice.pctChanged === "number", "pctChanged should be a number");
    }

    // Assert synthetic structure (if data exists)
    if (json.syntheticFailures15m.length > 0) {
      const synthFields = ["providerId", "market", "checks", "failures", "pctFail", "status", "action"];
      const firstSynth = json.syntheticFailures15m[0];
      synthFields.forEach(field => {
        assert(field in firstSynth, `Synthetic record missing field: ${field}`);
      });
      
      assert(typeof firstSynth.pctFail === "number", "pctFail should be a number");
    }

    // Assert landing rate structure
    assert(typeof json.landedRate24h.landedPct === "number", "landedPct should be a number");
    assert(typeof json.landedRate24h.status === "string", "landing status should be a string");

    // Assert summary structure
    assert(Array.isArray(json.summary.criticalIssues), "criticalIssues should be an array");
    assert(typeof json.summary.overallHealth === "number", "overallHealth should be a number");

    // Assert status values are valid
    const validStatuses = ["HEALTHY", "WARNING", "CRITICAL"];
    json.epcByProviderMarket.forEach((item: any, i: number) => {
      assert(validStatuses.includes(item.status), `Invalid EPC status at index ${i}: ${item.status}`);
    });

    console.log("✅ Daily ops API shape validated successfully");
    console.log(`📊 Data summary:`);
    console.log(`   - EPC records: ${json.epcByProviderMarket.length}`);
    console.log(`   - Price records: ${json.priceChangeRates.length}`);
    console.log(`   - Synthetic records: ${json.syntheticFailures15m.length}`);
    console.log(`   - Landing rate: ${json.landedRate24h.landedPct}%`);
    console.log(`   - Overall health: ${json.summary.overallHealth}%`);
    console.log(`   - Critical issues: ${json.summary.criticalIssues.length}`);

  } catch (error) {
    console.error("❌ Daily ops API shape test failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);