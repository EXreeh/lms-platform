"use client";

import { Button } from "@/components/ui/button";
import { getResourceAccessMode } from "@/lib/resource-preview";

interface ResourceFileActionsProps {
  url: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export function ResourceFileActions({ url, fileName, mimeType }: ResourceFileActionsProps) {
  const mode = getResourceAccessMode({ url, fileName, mimeType });

  if (mode === "open") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Button type="button" variant="secondary" size="sm">
          Open
        </Button>
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" download={fileName ?? true}>
      <Button type="button" variant="secondary" size="sm">
        Download
      </Button>
    </a>
  );
}
