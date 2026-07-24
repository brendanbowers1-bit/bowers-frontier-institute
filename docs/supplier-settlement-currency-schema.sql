-- PostgreSQL reference schema for supplier invoice currency and settlement currency management.
-- This module can share the same database as settlement-pricing-schema.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE currencies (
  code char(3) PRIMARY KEY CHECK (code = upper(code)),
  numeric_code char(3),
  name text NOT NULL,
  minor_units smallint NOT NULL DEFAULT 2 CHECK (minor_units BETWEEN 0 AND 4),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'restricted')),
  invoice_enabled boolean NOT NULL DEFAULT true,
  settlement_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  display_name text NOT NULL,
  country_code char(2) NOT NULL,
  supplier_type text NOT NULL DEFAULT 'vendor' CHECK (
    supplier_type IN ('vendor', 'liquidity_provider', 'agent', 'processor', 'treasury_counterparty')
  ),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked', 'pending_review')),
  external_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (external_reference)
);

CREATE TABLE supplier_currency_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  default_invoice_currency char(3) NOT NULL REFERENCES currencies(code),
  default_settlement_currency char(3) NOT NULL REFERENCES currencies(code),
  settlement_frequency text NOT NULL DEFAULT 'weekly' CHECK (
    settlement_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'on_demand')
  ),
  minimum_settlement_amount numeric(18, 4) NOT NULL DEFAULT 0 CHECK (minimum_settlement_amount >= 0),
  hold_days integer NOT NULL DEFAULT 0 CHECK (hold_days >= 0),
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz CHECK (effective_to IS NULL OR effective_to > effective_from),
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX supplier_currency_profiles_current_idx
  ON supplier_currency_profiles (supplier_id)
  WHERE effective_to IS NULL;

CREATE TABLE supplier_settlement_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  currency_code char(3) NOT NULL REFERENCES currencies(code),
  rail text NOT NULL CHECK (rail IN ('ach', 'wire', 'swift', 'sepa', 'faster_payments', 'mobile_wallet', 'internal')),
  account_country_code char(2) NOT NULL,
  beneficiary_name text NOT NULL,
  masked_account_reference text NOT NULL,
  account_token text,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'verified', 'failed', 'expired')
  ),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, currency_code, rail, masked_account_reference)
);

CREATE INDEX supplier_settlement_accounts_lookup_idx
  ON supplier_settlement_accounts (supplier_id, currency_code, rail, status, verification_status);

CREATE TABLE supplier_fx_rate_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('treasury_table', 'bank_feed', 'market_data', 'manual')),
  permission_basis text NOT NULL,
  priority integer NOT NULL DEFAULT 100 CHECK (priority >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_name)
);

CREATE TABLE supplier_fx_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES supplier_fx_rate_sources(id),
  base_currency char(3) NOT NULL REFERENCES currencies(code),
  quote_currency char(3) NOT NULL REFERENCES currencies(code),
  rate numeric(20, 8) NOT NULL CHECK (rate > 0),
  observed_at timestamptz NOT NULL,
  expires_at timestamptz CHECK (expires_at IS NULL OR expires_at > observed_at),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, base_currency, quote_currency, observed_at)
);

CREATE INDEX supplier_fx_rates_lookup_idx
  ON supplier_fx_rates (base_currency, quote_currency, observed_at DESC);

CREATE TABLE supplier_settlement_currency_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_country_code char(2),
  invoice_currency char(3) NOT NULL REFERENCES currencies(code),
  settlement_currency char(3) NOT NULL REFERENCES currencies(code),
  settlement_rail text NOT NULL CHECK (
    settlement_rail IN ('ach', 'wire', 'swift', 'sepa', 'faster_payments', 'mobile_wallet', 'internal')
  ),
  rule_type text NOT NULL CHECK (
    rule_type IN ('fixed', 'pass_through', 'supplier_country_default', 'platform_default', 'treasury_override')
  ),
  priority integer NOT NULL DEFAULT 100 CHECK (priority >= 0),
  fx_markup_bps integer NOT NULL DEFAULT 0 CHECK (fx_markup_bps >= 0),
  settlement_fee numeric(18, 4) NOT NULL DEFAULT 0 CHECK (settlement_fee >= 0),
  minimum_invoice_amount numeric(18, 4) NOT NULL DEFAULT 0 CHECK (minimum_invoice_amount >= 0),
  maximum_invoice_amount numeric(18, 4) CHECK (
    maximum_invoice_amount IS NULL OR maximum_invoice_amount > minimum_invoice_amount
  ),
  effective_from timestamptz NOT NULL,
  effective_to timestamptz CHECK (effective_to IS NULL OR effective_to > effective_from),
  source text NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (supplier_id IS NOT NULL OR supplier_country_code IS NOT NULL OR rule_type = 'platform_default')
);

CREATE INDEX supplier_settlement_rules_lookup_idx
  ON supplier_settlement_currency_rules (
    supplier_id,
    supplier_country_code,
    invoice_currency,
    priority,
    effective_from DESC
  );

CREATE UNIQUE INDEX supplier_settlement_rules_current_supplier_idx
  ON supplier_settlement_currency_rules (
    supplier_id,
    invoice_currency,
    settlement_currency,
    settlement_rail,
    rule_type
  )
  WHERE supplier_id IS NOT NULL AND effective_to IS NULL;

CREATE TABLE supplier_settlement_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  rule_id uuid NOT NULL REFERENCES supplier_settlement_currency_rules(id),
  fx_rate_id uuid REFERENCES supplier_fx_rates(id),
  settlement_account_id uuid REFERENCES supplier_settlement_accounts(id),
  external_payable_id text NOT NULL,
  invoice_currency char(3) NOT NULL REFERENCES currencies(code),
  invoice_amount numeric(18, 4) NOT NULL CHECK (invoice_amount >= 0),
  settlement_currency char(3) NOT NULL REFERENCES currencies(code),
  base_fx_rate numeric(20, 8) NOT NULL DEFAULT 1 CHECK (base_fx_rate > 0),
  applied_fx_rate numeric(20, 8) NOT NULL DEFAULT 1 CHECK (applied_fx_rate > 0),
  fx_markup_bps integer NOT NULL DEFAULT 0 CHECK (fx_markup_bps >= 0),
  settlement_fee numeric(18, 4) NOT NULL DEFAULT 0 CHECK (settlement_fee >= 0),
  expected_settlement_amount numeric(18, 4) NOT NULL CHECK (expected_settlement_amount >= 0),
  quoted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'quoted' CHECK (
    status IN ('quoted', 'approved', 'expired', 'batched', 'cancelled')
  ),
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, external_payable_id, quoted_at)
);

CREATE INDEX supplier_settlement_quotes_status_idx
  ON supplier_settlement_quotes (supplier_id, status, expires_at);

CREATE TABLE supplier_settlement_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  settlement_currency char(3) NOT NULL REFERENCES currencies(code),
  settlement_date date NOT NULL,
  batch_reference text NOT NULL,
  item_count integer NOT NULL DEFAULT 0 CHECK (item_count >= 0),
  expected_total_settlement numeric(18, 4) NOT NULL DEFAULT 0 CHECK (expected_total_settlement >= 0),
  actual_total_settlement numeric(18, 4) CHECK (actual_total_settlement IS NULL OR actual_total_settlement >= 0),
  status text NOT NULL DEFAULT 'pending_approval' CHECK (
    status IN ('pending_approval', 'approved', 'submitted', 'settled', 'reconciled', 'cancelled')
  ),
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, batch_reference)
);

CREATE TABLE supplier_settlement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES supplier_settlement_batches(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES supplier_settlement_quotes(id),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  external_payable_id text NOT NULL,
  invoice_currency char(3) NOT NULL REFERENCES currencies(code),
  invoice_amount numeric(18, 4) NOT NULL CHECK (invoice_amount >= 0),
  settlement_currency char(3) NOT NULL REFERENCES currencies(code),
  expected_settlement_amount numeric(18, 4) NOT NULL CHECK (expected_settlement_amount >= 0),
  actual_settlement_amount numeric(18, 4) CHECK (actual_settlement_amount IS NULL OR actual_settlement_amount >= 0),
  variance_amount numeric(18, 4),
  payout_reference text,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'submitted', 'settled', 'exception', 'cancelled')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, external_payable_id)
);

CREATE INDEX supplier_settlement_items_batch_idx ON supplier_settlement_items (batch_id);
CREATE INDEX supplier_settlement_items_supplier_status_idx
  ON supplier_settlement_items (supplier_id, status, created_at DESC);

CREATE TABLE supplier_currency_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  reason text NOT NULL,
  request_id text,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX supplier_currency_audit_events_entity_idx
  ON supplier_currency_audit_events (entity_type, entity_id, created_at DESC);

CREATE VIEW current_supplier_currency_profiles AS
SELECT
  scp.*,
  s.legal_name,
  s.display_name,
  s.country_code
FROM supplier_currency_profiles scp
JOIN suppliers s ON s.id = scp.supplier_id
WHERE scp.effective_to IS NULL;

CREATE VIEW current_supplier_settlement_rules AS
SELECT
  rule.*,
  s.legal_name,
  s.display_name,
  s.country_code
FROM supplier_settlement_currency_rules rule
LEFT JOIN suppliers s ON s.id = rule.supplier_id
WHERE rule.effective_to IS NULL;

CREATE VIEW supplier_currency_matrix AS
SELECT
  s.id AS supplier_id,
  s.display_name AS supplier_name,
  s.country_code,
  profile.default_invoice_currency,
  profile.default_settlement_currency,
  rule.invoice_currency,
  rule.settlement_currency,
  rule.settlement_rail,
  rule.rule_type,
  rule.priority,
  account.id AS settlement_account_id,
  account.verification_status AS settlement_account_status
FROM suppliers s
LEFT JOIN current_supplier_currency_profiles profile ON profile.supplier_id = s.id
LEFT JOIN current_supplier_settlement_rules rule ON rule.supplier_id = s.id
LEFT JOIN supplier_settlement_accounts account
  ON account.supplier_id = s.id
  AND account.currency_code = rule.settlement_currency
  AND account.rail = rule.settlement_rail
  AND account.status = 'active';

