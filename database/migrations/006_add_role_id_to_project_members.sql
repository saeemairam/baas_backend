USE baas_db;

ALTER TABLE project_members
  ADD COLUMN role_id CHAR(36) NULL AFTER user_id,
  ADD CONSTRAINT fk_project_members_role
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT;