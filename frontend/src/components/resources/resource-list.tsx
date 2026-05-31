"use client";

import { motion } from "framer-motion";
import type { Resource } from "@/types/resource";
import { RESOURCE_TYPE_ICONS, RESOURCE_TYPE_LABELS } from "@/types/resource";
import { Button } from "@/components/ui/button";

interface ResourceListProps {
  resources: Resource[];
  editable?: boolean;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  emptyMessage?: string;
}

export function ResourceList({
  resources,
  editable,
  onEdit,
  onDelete,
  emptyMessage = "No resources yet.",
}: ResourceListProps) {
  if (resources.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {resources.map((resource, i) => (
        <motion.li
          key={resource.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex min-w-0 gap-3">
            <span className="text-2xl" aria-hidden>
              {RESOURCE_TYPE_ICONS[resource.type]}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{resource.title}</p>
              <p className="text-xs text-muted-foreground">
                {RESOURCE_TYPE_LABELS[resource.type]}
                {resource.fileName ? ` · ${resource.fileName}` : ""}
              </p>
              {resource.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{resource.description}</p>
              )}
              {resource.deleteStatus === "PENDING_DELETE" && (
                <span className="mt-1 inline-block text-xs text-amber-600">Pending deletion</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="secondary" size="sm">
                Open
              </Button>
            </a>
            {editable && onEdit && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(resource)}>
                Edit
              </Button>
            )}
            {editable && onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => onDelete(resource)}
              >
                Remove
              </Button>
            )}
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
