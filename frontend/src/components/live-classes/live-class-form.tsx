"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { MeetingProvider } from "@/types/institute";

export interface LiveClassFormValues {
  batchId: string;
  courseId: string;
  teacherId: string;
  title: string;
  description: string;
  scheduledAt: string;
  durationMinutes: string;
  meetingProvider: MeetingProvider;
  meetingUrl: string;
  meetingId: string;
  meetingPassword: string;
  startUrl: string;
  joinUrl: string;
}

interface LiveClassFormProps {
  values: LiveClassFormValues;
  onChange: (values: LiveClassFormValues) => void;
  batches: { value: string; label: string }[];
  courses?: { value: string; label: string }[];
  teachers?: { value: string; label: string }[];
  showTeacherSelect?: boolean;
  showStartUrl?: boolean;
}

export function LiveClassForm({
  values,
  onChange,
  batches,
  courses,
  teachers,
  showTeacherSelect,
  showStartUrl = true,
}: LiveClassFormProps) {
  function set<K extends keyof LiveClassFormValues>(key: K, value: LiveClassFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {courses && courses.length > 0 ? (
        <Select
          label="Course"
          options={[{ value: "", label: "Auto from batch" }, ...courses]}
          value={values.courseId}
          onChange={(e) => set("courseId", e.target.value)}
        />
      ) : null}
      <Select
        label="Batch"
        options={[{ value: "", label: "Select batch" }, ...batches]}
        value={values.batchId}
        onChange={(e) => set("batchId", e.target.value)}
      />
      {showTeacherSelect && teachers ? (
        <Select
          label="Teacher"
          options={[{ value: "", label: "From batch" }, ...teachers]}
          value={values.teacherId}
          onChange={(e) => set("teacherId", e.target.value)}
        />
      ) : null}
      <Input label="Title" value={values.title} onChange={(e) => set("title", e.target.value)} />
      <Input
        label="Date & time"
        type="datetime-local"
        value={values.scheduledAt}
        onChange={(e) => set("scheduledAt", e.target.value)}
      />
      <Input
        label="Duration (minutes)"
        type="number"
        value={values.durationMinutes}
        onChange={(e) => set("durationMinutes", e.target.value)}
      />
      <Select
        label="Meeting provider"
        options={[
          { value: "ZOOM", label: "Zoom" },
          { value: "GOOGLE_MEET", label: "Google Meet" },
          { value: "CUSTOM", label: "Custom link" },
        ]}
        value={values.meetingProvider}
        onChange={(e) => set("meetingProvider", e.target.value as MeetingProvider)}
      />
      <div className="sm:col-span-2">
        <Input
          label="Zoom / meeting link"
          placeholder="https://zoom.us/j/..."
          value={values.meetingUrl}
          onChange={(e) => set("meetingUrl", e.target.value)}
        />
      </div>
      <Input
        label="Meeting ID (optional)"
        value={values.meetingId}
        onChange={(e) => set("meetingId", e.target.value)}
      />
      <Input
        label="Meeting password (optional)"
        value={values.meetingPassword}
        onChange={(e) => set("meetingPassword", e.target.value)}
      />
      <Input
        label="Join URL (optional — defaults to meeting link)"
        value={values.joinUrl}
        onChange={(e) => set("joinUrl", e.target.value)}
      />
      {showStartUrl ? (
        <Input
          label="Host start URL (teacher/admin only)"
          value={values.startUrl}
          onChange={(e) => set("startUrl", e.target.value)}
        />
      ) : null}
      <div className="sm:col-span-2">
        <Input
          label="Description"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
    </div>
  );
}
