CREATE DATABASE IF NOT EXISTS ai_code_review CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_code_review;

CREATE TABLE IF NOT EXISTS users (
  id                  VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  email               VARCHAR(255)  NOT NULL UNIQUE,
  name                VARCHAR(255)  NOT NULL DEFAULT '',
  verified            BOOLEAN       NOT NULL DEFAULT FALSE,
  plan                ENUM('free','solo','team','company') NOT NULL DEFAULT 'free',
  reviews_used        INT           NOT NULL DEFAULT 0,
  reviews_limit       INT           NOT NULL DEFAULT 10,
  ls_subscription_id  VARCHAR(255)  NULL,
  ls_customer_id      VARCHAR(255)  NULL,
  github_username     VARCHAR(255)  NULL,
  github_token        TEXT          NULL,
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_ls_subscription (ls_subscription_id)
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  email       VARCHAR(255) NOT NULL,
  code        VARCHAR(6)   NOT NULL,
  expires_at  DATETIME     NOT NULL,
  used        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_email (email),
  INDEX idx_otp_expires (expires_at)
);

CREATE TABLE IF NOT EXISTS repos (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  user_id     VARCHAR(36)  NOT NULL,
  github_id   BIGINT       NOT NULL,
  name        VARCHAR(255) NOT NULL,
  full_name   VARCHAR(500) NOT NULL,
  install_id  BIGINT       NULL,
  private     BOOLEAN      NOT NULL DEFAULT FALSE,
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_repo_user (user_id),
  UNIQUE KEY uq_repo_user (user_id, github_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id            VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  repo_id       VARCHAR(36)   NOT NULL,
  pr_number     INT           NOT NULL,
  pr_title      VARCHAR(500)  NOT NULL DEFAULT '',
  pr_url        VARCHAR(1000) NOT NULL DEFAULT '',
  pr_author     VARCHAR(255)  NOT NULL DEFAULT '',
  diff_size     INT           NOT NULL DEFAULT 0,
  feedback      LONGTEXT      NULL,
  tokens_used   INT           NOT NULL DEFAULT 0,
  status        ENUM('pending','completed','failed') NOT NULL DEFAULT 'pending',
  error_message TEXT          NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE,
  INDEX idx_review_repo (repo_id),
  INDEX idx_review_created (created_at)
);

CREATE TABLE IF NOT EXISTS payment_events (
  id            VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  user_id       VARCHAR(36)  NULL,
  event_name    VARCHAR(100) NOT NULL,
  ls_event_id   VARCHAR(255) NULL,
  plan          VARCHAR(50)  NULL,
  amount_cents  INT          NULL,
  currency      VARCHAR(10)  NULL,
  raw_payload   LONGTEXT     NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_user (user_id)
);

-- Drop and recreate otp_codes with hashed code column
DROP TABLE IF EXISTS otp_codes;
CREATE TABLE otp_codes (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  email       VARCHAR(255) NOT NULL,
  code_hash   VARCHAR(64)  NOT NULL,   -- SHA-256 hash, NOT plaintext
  expires_at  DATETIME     NOT NULL,
  used        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_email (email),
  INDEX idx_otp_expires (expires_at)
);

-- Fix 6: idempotency key on payment_events to deduplicate LS webhook replays
ALTER TABLE payment_events
  ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD UNIQUE INDEX IF NOT EXISTS uq_ls_event_id (ls_event_id);