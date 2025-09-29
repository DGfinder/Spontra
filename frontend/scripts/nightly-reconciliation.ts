#!/usr/bin/env tsx
/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const providerRefCache = new Map<string, string | null>();

async function resolveProviderRef(providerId: string) {
  const key = providerId.trim();
  if (!key) return null;
  if (providerRefCache.has(key)) {
    return providerRefCache.get(key) ?? null;
  }
  const provider = await prisma.provider.findFirst({ where: { providerId: key } });
  if (!provider) {
    console.warn(`[reconcile] Unknown providerId "${key}"; skipping conversion.`);
    providerRefCache.set(key, null);
    return null;
  }
  providerRefCache.set(key, provider.id);
  return provider.id;
}

/**
 * Supports two modes per network:
 * 1) CSV file paths via env (offline export)
 * 2) Direct HTTPS download via env (if you configure signed URLs)
 *
 * Set ONE of these per network:
 * IMPACT_CSV_PATH or IMPACT_REPORT_URL
 * CJ_CSV_PATH     or CJ_REPORT_URL
 */

const IMPACT_CSV_PATH = process.env.IMPACT_CSV_PATH;
const IMPACT_REPORT_URL = process.env.IMPACT_REPORT_URL;
const CJ_CSV_PATH = process.env.CJ_CSV_PATH;
const CJ_REPORT_URL = process.env.CJ_REPORT_URL;

type Row = Record<string, string>;

async function fetchText(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return await res.text();
}

function readCsvText(txt: string): Row[] {
  const [headerLine, ...lines] = txt.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",").map(h => h.trim());
  return lines.map(line => {
    // naive CSV split; acceptable for standard exports without quoted commas.
    const cols = line.split(","); 
    const row: Row = {};
    headers.forEach((h, i) => row[h] = (cols[i] ?? "").trim());
    return row;
  });
}

async function loadCsvRows(label: "impact" | "cj"): Promise<Row[]> {
  if (label === "impact") {
    if (IMPACT_CSV_PATH && fs.existsSync(IMPACT_CSV_PATH)) {
      return readCsvText(fs.readFileSync(path.resolve(IMPACT_CSV_PATH), "utf8"));
    }
    if (IMPACT_REPORT_URL) {
      return readCsvText(await fetchText(IMPACT_REPORT_URL));
    }
    console.warn("[impact] No CSV path or URL configured; skipping.");
    return [];
  } else {
    if (CJ_CSV_PATH && fs.existsSync(CJ_CSV_PATH)) {
      return readCsvText(fs.readFileSync(path.resolve(CJ_CSV_PATH), "utf8"));
    }
    if (CJ_REPORT_URL) {
      return readCsvText(await fetchText(CJ_REPORT_URL));
    }
    console.warn("[cj] No CSV path or URL configured; skipping.");
    return [];
  }
}

function normalizeImpact(row: Row) {
  // Typical Impact fields (names vary by export)
  const clickId = row.subId || row.sub_id || row.SID || "";
  const status = (row.State || row.Status || "pending").toUpperCase(); // APPROVED|PENDING|REJECTED
  const amount = Number(row.Payout || row.Commission || row.Amount || 0);
  const currency = row.Currency || "USD";
  const advertiserId = row.AdvertiserId || row.Advertiser || "impact";
  return { clickId, status, amount, currency, advertiserId, raw: row };
}

function normalizeCj(row: Row) {
  // Typical CJ fields (names vary by export)
  const clickId = row.sid || row.SID || row.subid || "";
  const status = (row.action_status || row.Status || "pending").toUpperCase();
  const amount = Number(row.commission_amount || row.Commission || 0);
  const currency = row.commission_currency || row.Currency || "USD";
  const advertiserId = row.advertiser_name || row.advertiser_id || "cj";
  return { clickId, status, amount, currency, advertiserId, raw: row };
}

async function upsertConversion(
  providerId: string,
  clickId: string,
  status: string,
  amount: number,
  currency: string,
  rawPayload: any
) {
  if (!clickId) return 0;
  const providerRef = await resolveProviderRef(providerId);
  if (!providerRef) return 0;
  try {
    await prisma.conversion.create({
      data: {
        clickId,
        status,
        commission: amount,
        currency,
        providerId,
        providerRef,
        rawPayload: JSON.stringify(rawPayload).slice(0, 8000),
      },
    });
    return 1;
  } catch {
    // duplicate or constraint violation - ignore
    return 0;
  }
}

async function reconcileImpact(): Promise<{ inserted: number }> {
  const rows = await loadCsvRows("impact");
  let inserted = 0;
  for (const r of rows) {
    const n = normalizeImpact(r);
    inserted += await upsertConversion(n.advertiserId, n.clickId, n.status, n.amount, n.currency, n.raw);
  }
  return { inserted };
}

async function reconcileCj(): Promise<{ inserted: number }> {
  const rows = await loadCsvRows("cj");
  let inserted = 0;
  for (const r of rows) {
    const n = normalizeCj(r);
    inserted += await upsertConversion(n.advertiserId, n.clickId, n.status, n.amount, n.currency, n.raw);
  }
  return { inserted };
}

async function main() {
  console.log("🌙 Nightly reconciliation start");
  const impact = await reconcileImpact();
  const cj = await reconcileCj();

  // Integrity checks (72h lag window)
  const pendingClicks = await prisma.$queryRawUnsafe<{ missing: number }[]>(`
    SELECT COUNT(*)::int AS missing
    FROM "Click" k
    WHERE k."createdAt" >= NOW() - INTERVAL '72 hours'
      AND k."landed200" = true
      AND NOT EXISTS (SELECT 1 FROM "Conversion" c WHERE c."clickId" = k."clickId")
  `);

  console.log(`• Impact inserted: ${impact.inserted}`);
  console.log(`• CJ inserted:     ${cj.inserted}`);
  console.log(`• Missing postbacks (<=72h window, landed200): ${pendingClicks[0]?.missing ?? 0}`);

  // TODO: optionally emit alerts via webhook/Slack if thresholds exceeded
  console.log("✅ Nightly reconciliation complete");
}

main().catch(err => {
  console.error("❌ Reconciliation failed:", err);
  process.exit(1);
}).finally(() => prisma.$disconnect());