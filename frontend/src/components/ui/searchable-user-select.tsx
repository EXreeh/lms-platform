"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Role } from "@/types/auth";

export interface UserSelectOption {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  subtitle?: string;
}

interface SearchableUserSelectProps {
  label: string;
  options: UserSelectOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  roleFilter?: Role | "";
  onRoleFilterChange?: (role: Role | "") => void;
  showRoleFilter?: boolean;
  disabled?: boolean;
  onSearchChange?: (query: string) => void;
  loading?: boolean;
}

const ROLE_OPTIONS: { value: Role | ""; label: string }[] = [
  { value: "", label: "All roles" },
  { value: "STUDENT", label: "Students" },
  { value: "TEACHER", label: "Teachers" },
  { value: "ADMIN", label: "Admins" },
];

export function SearchableUserSelect({
  label,
  options,
  value,
  onChange,
  multiple = false,
  placeholder = "Search by name or email…",
  roleFilter = "",
  onRoleFilterChange,
  showRoleFilter = false,
  disabled = false,
  onSearchChange,
  loading = false,
}: SearchableUserSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSearchChange?.(query);
  }, [query, onSearchChange]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((o) => {
      if (roleFilter && o.role !== roleFilter) return false;
      if (!q) return true;
      return (
        o.name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.role.toLowerCase().includes(q)
      );
    });
  }, [options, query, roleFilter]);

  const selectedLabels = options
    .filter((o) => value.includes(o.id))
    .map((o) => o.name);

  function toggle(id: string) {
    if (multiple) {
      onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
    } else {
      onChange([id]);
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {showRoleFilter && onRoleFilterChange ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r.value || "all"}
              type="button"
              disabled={disabled}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                roleFilter === r.value
                  ? "bg-green-700 text-white dark:bg-green-600"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onRoleFilterChange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        className="flex min-h-[2.75rem] w-full items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2 text-left text-sm disabled:opacity-60"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={selectedLabels.length ? "text-foreground" : "text-muted-foreground"}>
          {selectedLabels.length
            ? multiple
              ? `${selectedLabels.length} selected`
              : selectedLabels[0]
            : placeholder}
        </span>
        <span className="text-muted-foreground">{open ? "▴" : "▾"}</span>
      </button>
      {value.length > 0 && multiple ? (
        <div className="flex flex-wrap gap-1.5">
          {options
            .filter((o) => value.includes(o.id))
            .map((o) => (
              <span
                key={o.id}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs"
              >
                {o.name}
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => onChange(value.filter((id) => id !== o.id))}
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      ) : null}
      {open && (
        <div className="absolute z-40 mt-1 max-h-64 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border p-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              autoFocus
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1 text-sm">
            {loading ? (
              <li className="px-3 py-2 text-muted-foreground">Loading…</li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2 text-muted-foreground">No matches</li>
            ) : (
              filtered.map((o) => {
                const active = value.includes(o.id);
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      className={`flex w-full flex-col px-3 py-2 text-left hover:bg-muted ${
                        active ? "bg-muted/70" : ""
                      }`}
                      onClick={() => toggle(o.id)}
                    >
                      <span className="font-medium">
                        {o.name}
                        {active ? " ✓" : ""}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {o.email} · {o.role}
                        {o.subtitle ? ` · ${o.subtitle}` : ""}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
