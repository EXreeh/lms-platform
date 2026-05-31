export type ResourceType = "PDF" | "NOTE" | "LINK" | "ASSIGNMENT" | "OTHER";
export type EntityStatus = "ACTIVE" | "PENDING_DELETE" | "DELETED";

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  url: string;
  fileName: string | null;
  courseId: string;
  lessonId: string | null;
  uploadedById: string;
  deleteStatus?: EntityStatus;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: { id: string; name: string; email: string };
  course?: { id: string; title: string; slug: string; status?: string };
  lesson?: { id: string; title: string } | null;
}

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  PDF: "PDF",
  NOTE: "Note",
  LINK: "Link",
  ASSIGNMENT: "Assignment",
  OTHER: "Other",
};

export const RESOURCE_TYPE_ICONS: Record<ResourceType, string> = {
  PDF: "📄",
  NOTE: "📝",
  LINK: "🔗",
  ASSIGNMENT: "📋",
  OTHER: "📎",
};
