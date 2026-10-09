USE baas_db;

ALTER TABLE project_members
  DROP COLUMN role,
  MODIFY COLUMN role_id CHAR(36) NOT NULL;