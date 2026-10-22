CREATE TABLE audit_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id CHAR(36) NULL,
  details JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_logs_project_created (project_id, created_at),
  CONSTRAINT fk_audit_logs_project
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);