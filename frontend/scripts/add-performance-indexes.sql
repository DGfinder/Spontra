-- Performance indexes for daily ops dashboard
-- Run these to keep ops queries snappy (<200ms)

-- Click fast paths
CREATE INDEX IF NOT EXISTS idx_click_created ON "Click" ("createdAt");
CREATE INDEX IF NOT EXISTS idx_click_provider_market ON "Click" ("providerId","market","createdAt");
CREATE INDEX IF NOT EXISTS idx_click_landed200 ON "Click" ("landed200","createdAt");

-- Conversion lookup
CREATE INDEX IF NOT EXISTS idx_conv_clickid ON "Conversion" ("clickId");

-- Synthetic & reprice monitoring
CREATE INDEX IF NOT EXISTS idx_synth_provider_market ON "SyntheticCheck" ("providerId","market","createdAt");
CREATE INDEX IF NOT EXISTS idx_synth_ok ON "SyntheticCheck" ("ok","createdAt");
CREATE INDEX IF NOT EXISTS idx_reprice_provider ON "RepriceLog" ("providerId","createdAt");
CREATE INDEX IF NOT EXISTS idx_reprice_status ON "RepriceLog" ("status","createdAt");

-- Alert logs (if you add them)
CREATE INDEX IF NOT EXISTS idx_alert_log_created ON "AlertLog" ("createdAt","severity");

-- Reconciliation logs
CREATE INDEX IF NOT EXISTS idx_reconcile_network_date ON "ReconciliationLog" ("network","date");

-- Comments for maintenance
COMMENT ON INDEX idx_click_provider_market IS 'Daily ops EPC queries by provider/market';
COMMENT ON INDEX idx_synth_provider_market IS 'Synthetic health monitoring';
COMMENT ON INDEX idx_reprice_provider IS 'Price change rate tracking';