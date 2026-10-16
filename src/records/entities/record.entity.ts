export interface ResourceRecord {
  id: string;
  resourceId: string;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
