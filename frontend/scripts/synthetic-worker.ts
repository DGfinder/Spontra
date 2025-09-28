#!/usr/bin/env tsx
/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import { buildDeeplink } from "../src/server/affiliates/buildDeeplink";

const prisma = new PrismaClient();

const cannedByMarket: Record<string, Array<{orig:string;dest:string;dep:string;ret?:string; currency:string; locale:string;}>> = {
  AU: [{ orig:"PER",dest:"DPS",dep:"2025-11-01",ret:"2025-11-10",currency:"AUD",locale:"en-AU" }],
  NZ: [{ orig:"AKL",dest:"SYD",dep:"2025-11-03",ret:"2025-11-09",currency:"NZD",locale:"en-NZ" }],
  GB: [{ orig:"LHR",dest:"BCN",dep:"2025-11-05",ret:"2025-11-12",currency:"GBP",locale:"en-GB" }],
  SG: [{ orig:"SIN",dest:"BKK",dep:"2025-11-08",ret:"2025-11-12",currency:"SGD",locale:"en-SG" }],
  JP: [{ orig:"NRT",dest:"KIX",dep:"2025-11-15",ret:"2025-11-18",currency:"JPY",locale:"ja-JP" }]
};

async function runOnce() {
  console.log("🔎 Synthetic monitor start");
  const providers = await prisma.provider.findMany({ 
    where: { isActive: true }, 
    include: { template: true } 
  });

  for (const p of providers) {
    const scenarios = cannedByMarket[p.market] ?? [];
    if (!p.template || scenarios.length === 0) continue;

    for (const sc of scenarios) {
      const clickId = `SYN-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      const query = {
        origin: sc.orig, 
        destination: sc.dest,
        departDate: sc.dep, 
        returnDate: sc.ret,
        pax: { ADT: 1, CHD: 0, INF_LAP: 0, INF_SEAT: 0 },
        cabin: "ECONOMY" as const, 
        currency: sc.currency, 
        market: p.market
      };

      try {
        const url = buildDeeplink({ 
          provider: p as any, 
          linkTemplate: p.template as any, 
          query, 
          clickId 
        });

        let status = 0, finalHost: string | undefined, ok = false, err: string | undefined;
        
        try {
          const res = await fetch(url, {
            redirect: "manual",
            headers: { 
              "User-Agent": "SpontraSynthetic/1.0", 
              "X-Spontra-Monitor": "1" 
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          
          status = res.status;
          try { 
            finalHost = new URL(url).host; 
          } catch {}
          ok = status >= 200 && status < 400;
        } catch (e: any) {
          err = e?.message ?? "fetch_failed";
        }

        await prisma.syntheticCheck.create({
          data: {
            providerId: p.providerId,
            market: p.market,
            testQuery: query,
            statusCode: status,
            responseTimeMs: null, // Could add timing if needed
            finalHost,
            titleHash: null,
            errorMessage: err,
            isHealthy: ok
          }
        });

        console.log(`• ${p.providerId}/${p.market} → ${status}${err ? " ("+err+")" : ""}`);
      } catch (buildError) {
        console.log(`• ${p.providerId}/${p.market} → Build failed: ${buildError}`);
        
        await prisma.syntheticCheck.create({
          data: {
            providerId: p.providerId,
            market: p.market,
            testQuery: query,
            statusCode: null,
            responseTimeMs: null,
            finalHost: null,
            titleHash: null,
            errorMessage: `Build failed: ${buildError}`,
            isHealthy: false
          }
        });
      }
    }
  }
  
  console.log("✅ Synthetic monitor done");
}

runOnce().finally(() => prisma.$disconnect());