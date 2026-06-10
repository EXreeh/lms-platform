"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface LiveClassFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  batchId: string;
  onBatchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  batches: Option[];
  showStatus?: boolean;
}

export function LiveClassFilters({
  search,
  onSearchChange,
  batchId,
  onBatchChange,
  status,
  onStatusChange,
  batches,
  showStatus = true,
}: LiveClassFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Input
        label="Search"
        placeholder="Search live classes..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <Select
        label="Batch"
        options={[{ value: "", label: "All batches" }, ...batches]}
        value={batchId}
        onChange={(e) => onBatchChange(e.target.value)}
      />
      {showStatus ? (
        <Select
          label="Status"
          options={[
            { value: "", label: "All statuses" },
            { value: "SCHEDULED", label: "Scheduled" },
            { value: "LIVE", label: "Live" },
            { value: "COMPLETED", label: "Completed" },
            { value: "CANCELLED", label: "Cancelled" },
          ]}
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        />
      ) : null}
    </div>
  );
}
