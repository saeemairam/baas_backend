ALTER TABLE api_keys
  ADD COLUMN last_used_at TIMESTAMP NULL AFTER created_at;