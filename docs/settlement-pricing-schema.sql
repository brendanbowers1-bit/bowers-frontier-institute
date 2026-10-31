-- PostgreSQL reference schema for the Western Union agent settlement pricing platform.
-- Use this as the first migration when introducing a persistent backend.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  display_name text NOT NULL,
  country_code char(2) NOT NULL,
  region text,
  contract_type text NOT NULL CHECK (contract_type IN ('direct_agent', 'sub_agent', 'aggregator')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE agent_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id),
  branch_code text NOT NULL,
  display_name text NOT NULL,
  country_code char(2) NOT NULL,
  city text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, branch_code)
);

CREATE TABLE corridors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_country_code char(2) NOT NULL,
  destination_country_code char(2) NOT NULL,
  send_currency char(3) NOT NULL,
  payout_currency char(3) NOT NULL,
  payout_method text NOT NULL CHECK (payout_method IN ('cash', 'bank_account', 'mobile_wallet', 'card')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (
    origin_country_code,
    destination_country_code,
    send_currency,
    payout_currency,
    payout_method
  )
);

CREATE TABLE pricing_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (
    source_type IN ('agent_statement', 'approved_api', 'manual_contract_term', 'public_quote', 'finance_adjustment')
  ),
  source_name text NOT NULL,
  external_reference text,
  permission_basis text NOT NULL,
  ingested_by text,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  source_hash text,
  notes text
);

CREATE TABLE amount_bands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id uuid NOT NULL REFERENCES corridors(id),
  min_amount numeric(18, 4) NOT NULL CHECK (min_amount >= 0),
  max_amount numeric(18, 4) CHECK (max_amount IS NULL OR max_amount > min_amount),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (corridor_id, min_amount, max_amount)
);

CREATE TABLE pricing_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id),
  corridor_id uuid NOT NULL REFERENCES corridors(id),
  amount_band_id uuid NOT NULL REFERENCES amount_bands(id),
  customer_fee numeric(18, 4) NOT NULL CHECK (customer_fee >= 0),
  customer_fx_rate numeric(20, 8) NOT NULL CHECK (customer_fx_rate > 0),
  settlement_fx_rate numeric(20, 8) NOT NULL CHECK (settlement_fx_rate > 0),
  commission_rate_bps integer NOT NULL DEFAULT 0 CHECK (commission_rate_bps >= 0),
  fixed_commission numeric(18, 4) NOT NULL DEFAULT 0 CHECK (fixed_commission >= 0),
  effective_from timestamptz NOT NULL,
  effective_to timestamptz CHECK (effective_to IS NULL OR effective_to > effective_from),
  source_id uuid NOT NULL REFERENCES pricing_sources(id),
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pricing_snapshots_lookup_idx
  ON pricing_snapshots (corridor_id, amount_band_id, agent_id, effective_from DESC);

CREATE UNIQUE INDEX pricing_snapshots_current_unique_idx
  ON pricing_snapshots (corridor_id, amount_band_id, COALESCE(agent_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE effective_to IS NULL;

CREATE TABLE settlement_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id),
  branch_id uuid REFERENCES agent_branches(id),
  statement_reference text NOT NULL,
  settlement_date date NOT NULL,
  settlement_currency char(3) NOT NULL,
  gross_send_amount numeric(18, 4) NOT NULL DEFAULT 0,
  total_customer_fees numeric(18, 4) NOT NULL DEFAULT 0,
  total_agent_commission numeric(18, 4) NOT NULL DEFAULT 0,
  total_net_settlement numeric(18, 4) NOT NULL DEFAULT 0,
  source_id uuid NOT NULL REFERENCES pricing_sources(id),
  import_status text NOT NULL DEFAULT 'imported' CHECK (
    import_status IN ('pending', 'imported', 'reconciled', 'failed')
  ),
  imported_by text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, statement_reference)
);

CREATE TABLE settlement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES settlement_batches(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id),
  branch_id uuid REFERENCES agent_branches(id),
  corridor_id uuid NOT NULL REFERENCES corridors(id),
  external_transaction_id text NOT NULL,
  transaction_time timestamptz NOT NULL,
  send_amount numeric(18, 4) NOT NULL CHECK (send_amount >= 0),
  customer_fee numeric(18, 4) NOT NULL DEFAULT 0 CHECK (customer_fee >= 0),
  payout_amount numeric(18, 4) NOT NULL DEFAULT 0 CHECK (payout_amount >= 0),
  customer_fx_rate numeric(20, 8) CHECK (customer_fx_rate IS NULL OR customer_fx_rate > 0),
  settlement_fx_rate numeric(20, 8) CHECK (settlement_fx_rate IS NULL OR settlement_fx_rate > 0),
  agent_commission numeric(18, 4) NOT NULL DEFAULT 0 CHECK (agent_commission >= 0),
  actual_net_settlement numeric(18, 4) NOT NULL,
  matched_pricing_snapshot_id uuid REFERENCES pricing_snapshots(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, external_transaction_id)
);

CREATE INDEX settlement_items_batch_idx ON settlement_items (batch_id);
CREATE INDEX settlement_items_corridor_time_idx ON settlement_items (corridor_id, transaction_time DESC);
CREATE INDEX settlement_items_agent_time_idx ON settlement_items (agent_id, transaction_time DESC);

CREATE TABLE reconciliation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id),
  batch_id uuid REFERENCES settlement_batches(id),
  started_by text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  variance_threshold_amount numeric(18, 4) NOT NULL DEFAULT 1,
  variance_threshold_bps integer NOT NULL DEFAULT 25,
  checked_item_count integer NOT NULL DEFAULT 0,
  exception_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message text
);

CREATE TABLE reconciliation_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES reconciliation_runs(id),
  settlement_item_id uuid NOT NULL REFERENCES settlement_items(id),
  agent_id uuid NOT NULL REFERENCES agents(id),
  exception_type text NOT NULL CHECK (
    exception_type IN ('missing_price', 'fee_variance', 'fx_rate_variance', 'commission_variance', 'net_settlement_variance')
  ),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  expected_amount numeric(18, 4),
  actual_amount numeric(18, 4),
  variance_amount numeric(18, 4),
  variance_bps integer,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'waived')),
  assigned_to text,
  resolution_reason text,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reconciliation_exceptions_queue_idx
  ON reconciliation_exceptions (agent_id, status, severity, created_at DESC);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  request_id text,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_entity_idx ON audit_events (entity_type, entity_id, created_at DESC);
CREATE INDEX audit_events_actor_idx ON audit_events (actor_id, created_at DESC);

CREATE VIEW current_pricing_snapshots AS
SELECT
  ps.*,
  c.origin_country_code,
  c.destination_country_code,
  c.send_currency,
  c.payout_currency,
  c.payout_method,
  ab.min_amount,
  ab.max_amount
FROM pricing_snapshots ps
JOIN corridors c ON c.id = ps.corridor_id
JOIN amount_bands ab ON ab.id = ps.amount_band_id
WHERE ps.effective_to IS NULL;

CREATE VIEW settlement_item_reconciliation_inputs AS
SELECT
  si.id AS settlement_item_id,
  si.agent_id,
  si.batch_id,
  si.corridor_id,
  si.external_transaction_id,
  si.transaction_time,
  si.send_amount,
  si.actual_net_settlement,
  ps.id AS pricing_snapshot_id,
  ps.customer_fee AS expected_customer_fee,
  ps.customer_fx_rate AS expected_customer_fx_rate,
  ps.settlement_fx_rate AS expected_settlement_fx_rate,
  ps.fixed_commission + (ps.customer_fee * ps.commission_rate_bps / 10000.0) AS expected_agent_commission,
  si.send_amount * ps.settlement_fx_rate
    - (ps.fixed_commission + (ps.customer_fee * ps.commission_rate_bps / 10000.0)) AS expected_net_settlement
FROM settlement_items si
LEFT JOIN LATERAL (
  SELECT candidate.*
  FROM pricing_snapshots candidate
  JOIN amount_bands ab
    ON ab.id = candidate.amount_band_id
    AND si.send_amount >= ab.min_amount
    AND (ab.max_amount IS NULL OR si.send_amount < ab.max_amount)
  WHERE candidate.corridor_id = si.corridor_id
    AND (candidate.agent_id = si.agent_id OR candidate.agent_id IS NULL)
    AND candidate.effective_from <= si.transaction_time
    AND (candidate.effective_to IS NULL OR candidate.effective_to > si.transaction_time)
  ORDER BY
    CASE WHEN candidate.agent_id = si.agent_id THEN 0 ELSE 1 END,
    candidate.effective_from DESC
  LIMIT 1
) ps ON true;

