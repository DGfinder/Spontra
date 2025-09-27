-- Add MFA fields to users table
ALTER TABLE "users" ADD COLUMN "mfa_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "mfa_secret" TEXT;
ALTER TABLE "users" ADD COLUMN "mfa_backup_codes" JSONB;
ALTER TABLE "users" ADD COLUMN "mfa_last_used_at" TIMESTAMP(3);

-- Create index for MFA enabled users (for admin queries)
CREATE INDEX "users_mfa_enabled_idx" ON "users"("mfa_enabled");
CREATE INDEX "users_role_mfa_enabled_idx" ON "users"("role", "mfa_enabled");