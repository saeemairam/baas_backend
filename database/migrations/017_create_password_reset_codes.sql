CREATE TABLE password_reset_codes (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_password_reset_codes_user (user_id, created_at),
  CONSTRAINT fk_password_reset_codes_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);