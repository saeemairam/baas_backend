CREATE TABLE api_keys (
  id          CHAR(36)     NOT NULL PRIMARY KEY,
  project_id  CHAR(36)     NOT NULL,
  name        VARCHAR(100) NOT NULL,
  key_hash    CHAR(64)     NOT NULL UNIQUE,
  key_prefix  VARCHAR(12)  NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at  TIMESTAMP    NULL,
  CONSTRAINT fk_api_keys_project
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);