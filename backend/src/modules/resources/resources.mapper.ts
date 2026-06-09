import type { Resource, User } from "@lms/database";
import { resolveResourceUrl } from "../../services/storage/video-url.helpers.js";

type ResourceWithUploader = Resource & {
  uploadedBy?: Pick<User, "id" | "firstName" | "lastName" | "email">;
};

export function mapResource(resource: ResourceWithUploader) {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    type: resource.type,
    url: resolveResourceUrl(resource),
    fileName: resource.fileName,
    mimeType: resource.mimeType ?? null,
    fileSize: resource.fileSize ?? null,
    storageProvider: resource.storageProvider ?? "local",
    courseId: resource.courseId,
    lessonId: resource.lessonId,
    uploadedById: resource.uploadedById,
    deleteStatus: resource.deleteStatus,
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
    uploadedBy: resource.uploadedBy
      ? {
          id: resource.uploadedBy.id,
          name: `${resource.uploadedBy.firstName} ${resource.uploadedBy.lastName}`.trim(),
          email: resource.uploadedBy.email,
        }
      : undefined,
  };
}
