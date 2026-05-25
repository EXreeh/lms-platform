"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface ThumbnailInputProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function ThumbnailInput({ value, onChange, disabled }: ThumbnailInputProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">Course thumbnail</label>
      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div
          className="relative aspect-video overflow-hidden rounded-xl border border-dashed border-border bg-muted"
          whileHover={{ borderColor: "var(--gold-500)" }}
        >
          {value ? (
            <Image src={value} alt="Thumbnail preview" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
              <span className="text-2xl opacity-40">🖼</span>
              <p className="text-xs text-muted-foreground">Paste an image URL to preview</p>
            </div>
          )}
        </motion.div>
        <div className="space-y-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/thumbnail.jpg"
            disabled={disabled}
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25"
          />
          <p className="text-xs text-muted-foreground">
            Use a direct image URL. File upload storage coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
