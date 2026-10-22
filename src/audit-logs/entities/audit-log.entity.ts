export interface AuditLog {
  id: string;
  projectId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: Date;
}
