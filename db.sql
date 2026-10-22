-- Gamer Marketplace schema (PostgreSQL)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  age SMALLINT NOT NULL CHECK (age >= 18),
  country VARCHAR(80) NOT NULL,
  region VARCHAR(80) NOT NULL,
  municipality VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user','owner','admin','moderator')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR(32) NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts SMALLINT NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS otp_codes_phone_created_idx ON otp_codes(phone, created_at DESC);

CREATE TABLE IF NOT EXISTS wallets (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
  purchased_coins BIGINT NOT NULL DEFAULT 0 CHECK (purchased_coins >= 0),
  earned_coins BIGINT NOT NULL DEFAULT 0 CHECK (earned_coins >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE RESTRICT,
  actor_user_id BIGINT REFERENCES users(id) ON DELETE RESTRICT,
  entry_type VARCHAR(40) NOT NULL,
  bucket VARCHAR(30) NOT NULL DEFAULT 'purchased',
  amount BIGINT NOT NULL CHECK (amount <> 0),
  reference VARCHAR(120),
  reason TEXT NOT NULL,
  idempotency_key VARCHAR(160) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ledger_user_created_idx ON ledger_entries(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS listings (
  id BIGSERIAL PRIMARY KEY,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  game VARCHAR(40) NOT NULL CHECK (game IN ('Minecraft','Fortnite','Warzone','Free Fire')),
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  skill_level SMALLINT NOT NULL CHECK (skill_level BETWEEN 1 AND 10),
  deliverables TEXT NOT NULL,
  deadline_hours INTEGER NOT NULL CHECK (deadline_hours BETWEEN 1 AND 2160),
  conditions TEXT NOT NULL,
  price_coins BIGINT NOT NULL CHECK (price_coins BETWEEN 1 AND 1000000000),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','needs_changes','paused')),
  moderation_reason TEXT,
  moderated_by BIGINT REFERENCES users(id) ON DELETE RESTRICT,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS listings_status_created_idx ON listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_game_status_idx ON listings(game, status);

CREATE TABLE IF NOT EXISTS contracts (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  price_coins BIGINT NOT NULL CHECK (price_coins > 0),
  commission_coins BIGINT NOT NULL CHECK (commission_coins >= 0),
  provider_coins BIGINT NOT NULL CHECK (provider_coins >= 0),
  status VARCHAR(30) NOT NULL CHECK (status IN ('paid_held','in_progress','delivered','completed','cancel_requested','cancelled','disputed','under_review','appealed','refunded')),
  delivery_note TEXT,
  delivery_evidence TEXT,
  buyer_review SMALLINT CHECK (buyer_review BETWEEN 1 AND 5),
  buyer_review_text TEXT,
  delivered_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (commission_coins + provider_coins = price_coins),
  CHECK (buyer_id <> seller_id)
);
CREATE INDEX IF NOT EXISTS contracts_buyer_created_idx ON contracts(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS contracts_seller_created_idx ON contracts(seller_id, created_at DESC);

CREATE TABLE IF NOT EXISTS disputes (
  id BIGSERIAL PRIMARY KEY,
  contract_id BIGINT NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
  opened_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  evidence TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','under_review','resolved','appealed')),
  decision TEXT,
  decided_by BIGINT REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  target_type VARCHAR(30) NOT NULL,
  target_id BIGINT NOT NULL,
  action VARCHAR(40) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cancellation_requests (
  id BIGSERIAL PRIMARY KEY,
  contract_id BIGINT NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
  requested_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','under_review')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bonus_fund_entries (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('fine_in','bonus_out','adjustment')),
  amount BIGINT NOT NULL CHECK (amount > 0),
  recipient_user_id BIGINT REFERENCES users(id) ON DELETE RESTRICT,
  reference VARCHAR(120),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
