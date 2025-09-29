import { prisma } from "@/lib/db";
import { buildDeeplink } from "@/server/affiliates/buildDeeplink";
import crypto from "node:crypto";

interface TestQuery {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  pax: { ADT: number; CHD: number; INF_LAP: number; INF_SEAT: number };
  cabin: "ECONOMY"|"PREMIUM_ECONOMY"|"BUSINESS"|"FIRST";
  market: string;
  currency: string;
  [key: string]: unknown;
}

// Pre-defined test queries for different route types
const TEST_QUERIES: Record<string, TestQuery> = {
  "short-haul": {
    origin: "SYD",
    destination: "MEL", 
    departDate: "2025-12-01",
    pax: { ADT: 1, CHD: 0, INF_LAP: 0, INF_SEAT: 0 },
    cabin: "ECONOMY",
    market: "AU",
    currency: "AUD"
  },
  "medium-haul": {
    origin: "PER",
    destination: "SIN",
    departDate: "2025-12-01",
    pax: { ADT: 2, CHD: 0, INF_LAP: 0, INF_SEAT: 0 },
    cabin: "ECONOMY", 
    market: "AU",
    currency: "AUD"
  },
  "long-haul": {
    origin: "SYD",
    destination: "LAX",
    departDate: "2025-12-01",
    returnDate: "2025-12-08",
    pax: { ADT: 1, CHD: 1, INF_LAP: 0, INF_SEAT: 0 },
    cabin: "BUSINESS",
    market: "AU", 
    currency: "AUD"
  }
};

interface SyntheticCheckResult {
  providerId: string;
  market: string;
  testType: string;
  url: string;
  statusCode?: number;
  responseTimeMs?: number;
  finalHost?: string;
  titleHash?: string;
  errorMessage?: string;
  isHealthy: boolean;
}

class SyntheticMonitor {
  private userAgent = "SpontraBot/1.0 (+https://spontra.com/bot) Synthetic-Monitor";
  
  async checkProvider(
    provider: any, 
    template: any, 
    testType: string
  ): Promise<SyntheticCheckResult> {
    const testQuery = TEST_QUERIES[testType];
    if (!testQuery) {
      throw new Error(`Unknown test type: ${testType}`);
    }

    const clickId = `synthetic_${provider.providerId}_${testType}_${Date.now()}`;
    
    try {
      const deeplink = buildDeeplink({
        provider,
        linkTemplate: template,
        query: testQuery,
        clickId,
        campaignId: "synthetic",
        placementId: "monitor"
      });

      const startTime = Date.now();
      
      // Fetch with timeout and special headers
      const response = await fetch(deeplink, {
        method: "GET",
        headers: {
          "User-Agent": this.userAgent,
          "X-Spontra-Monitor": "1", // Let providers know this is monitoring
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        redirect: "follow", // Follow redirects
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      const responseTimeMs = Date.now() - startTime;
      const finalUrl = response.url;
      const finalHost = new URL(finalUrl).hostname;
      
      // Get page title for consistency checking
      let titleHash: string | undefined;
      if (response.ok && response.headers.get("content-type")?.includes("text/html")) {
        try {
          const html = await response.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            titleHash = crypto.createHash("sha256")
              .update(titleMatch[1].trim())
              .digest("hex")
              .slice(0, 16);
          }
        } catch (titleError) {
          console.warn(`Failed to extract title for ${provider.providerId}:`, titleError);
        }
      }

      // Basic health checks
      const isHealthy = response.ok && 
                       responseTimeMs < 10000 && // Under 10 seconds
                       finalHost.includes(provider.providerId.toLowerCase().replace(/[^a-z]/g, "")) || 
                       finalHost.includes("booking") ||
                       finalHost.includes("flight");

      return {
        providerId: provider.providerId,
        market: provider.market,
        testType,
        url: deeplink,
        statusCode: response.status,
        responseTimeMs,
        finalHost,
        titleHash,
        isHealthy
      };

    } catch (error: any) {
      console.error(`Synthetic check failed for ${provider.providerId}:`, error);
      
      return {
        providerId: provider.providerId,
        market: provider.market,
        testType,
        url: "failed_to_generate",
        errorMessage: error.message?.slice(0, 255) || "Unknown error",
        isHealthy: false
      };
    }
  }

  async runFullCheck(): Promise<SyntheticCheckResult[]> {
    console.log("🔍 Starting synthetic monitor checks...");
    
    // Get all active providers with templates
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      include: { template: true }
    });

    const results: SyntheticCheckResult[] = [];
    
    for (const provider of providers) {
      if (!provider.template) {
        console.warn(`Provider ${provider.providerId} has no template, skipping`);
        continue;
      }

      console.log(`Checking ${provider.providerId} (${provider.market})...`);
      
      // Test with multiple query types for comprehensive coverage
      for (const testType of ["short-haul", "medium-haul"]) {
        try {
          const result = await this.checkProvider(provider, provider.template, testType);
          results.push(result);
          
          // Store result in database
          await prisma.syntheticCheck.create({
            data: {
              providerId: provider.providerId,
              market: provider.market,
              testQuery: TEST_QUERIES[testType] as any,
              statusCode: result.statusCode,
              responseTimeMs: result.responseTimeMs,
              finalHost: result.finalHost,
              titleHash: result.titleHash,
              errorMessage: result.errorMessage,
              isHealthy: result.isHealthy
            }
          });

          // Rate limiting - wait between checks
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`Failed to check ${provider.providerId} with ${testType}:`, error);
        }
      }
    }

    console.log(`✅ Synthetic monitor completed: ${results.length} checks performed`);
    
    // Log summary
    const healthyCount = results.filter(r => r.isHealthy).length;
    const avgResponseTime = results
      .filter(r => r.responseTimeMs)
      .reduce((sum, r) => sum + (r.responseTimeMs || 0), 0) / results.length;

    console.log(`📊 Health summary: ${healthyCount}/${results.length} healthy, avg response: ${Math.round(avgResponseTime)}ms`);
    
    return results;
  }

  async getHealthReport(hoursBack: number = 24): Promise<any> {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    
    const checks = await prisma.syntheticCheck.findMany({
      where: {
        checkedAt: { gte: since }
      },
      orderBy: { checkedAt: "desc" }
    });

    const byProvider = checks.reduce((acc, check) => {
      const key = `${check.providerId}_${check.market}`;
      if (!acc[key]) {
        acc[key] = {
          providerId: check.providerId,
          market: check.market,
          totalChecks: 0,
          healthyChecks: 0,
          avgResponseTime: 0,
          lastCheck: check.checkedAt,
          errors: []
        };
      }
      
      acc[key].totalChecks++;
      if (check.isHealthy) acc[key].healthyChecks++;
      if (check.responseTimeMs) {
        acc[key].avgResponseTime = 
          (acc[key].avgResponseTime * (acc[key].totalChecks - 1) + check.responseTimeMs) / acc[key].totalChecks;
      }
      if (check.errorMessage) {
        acc[key].errors.push(check.errorMessage);
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(byProvider).map((provider: any) => ({
      ...provider,
      healthPercentage: Math.round((provider.healthyChecks / provider.totalChecks) * 100),
      avgResponseTime: Math.round(provider.avgResponseTime),
      errors: provider.errors.slice(0, 3) // Latest 3 errors
    }));
  }
}

export const syntheticMonitor = new SyntheticMonitor();

// Export for cron job usage
export async function runSyntheticChecks() {
  try {
    return await syntheticMonitor.runFullCheck();
  } catch (error) {
    console.error("Synthetic monitor error:", error);
    throw error;
  }
}

// For manual testing
if (require.main === module) {
  runSyntheticChecks()
    .then(results => {
      console.log("Manual synthetic check completed:", results.length, "checks");
      process.exit(0);
    })
    .catch(error => {
      console.error("Manual synthetic check failed:", error);
      process.exit(1);
    });
}