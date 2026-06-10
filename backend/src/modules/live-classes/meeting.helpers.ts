import type { MeetingProvider } from "@lms/database";

export interface MeetingInput {
  meetingProvider?: MeetingProvider;
  meetingUrl?: string | null;
  meetingId?: string | null;
  meetingPassword?: string | null;
  startUrl?: string | null;
  joinUrl?: string | null;
  /** @deprecated legacy field */
  liveUrl?: string | null;
}

export interface NormalizedMeeting {
  meetingProvider: MeetingProvider;
  meetingUrl: string | null;
  meetingId: string | null;
  meetingPassword: string | null;
  startUrl: string | null;
  joinUrl: string | null;
}

function trimOrNull(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function extractZoomMeetingId(url: string): string | null {
  const patterns = [
    /zoom\.us\/j\/(\d+)/i,
    /zoom\.us\/wc\/join\/(\d+)/i,
    /zoom\.us\/my\/([^/?#]+)/i,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function normalizeMeetingInput(input: MeetingInput): NormalizedMeeting {
  const meetingProvider = input.meetingProvider ?? "ZOOM";
  let meetingUrl = trimOrNull(input.meetingUrl ?? input.liveUrl);
  let joinUrl = trimOrNull(input.joinUrl) ?? meetingUrl;
  const startUrl = trimOrNull(input.startUrl);
  let meetingId = trimOrNull(input.meetingId);

  if (!meetingId && meetingUrl && meetingProvider === "ZOOM") {
    meetingId = extractZoomMeetingId(meetingUrl);
  }

  if (meetingUrl && !joinUrl) joinUrl = meetingUrl;
  if (joinUrl && !meetingUrl) meetingUrl = joinUrl;

  return {
    meetingProvider,
    meetingUrl,
    meetingId,
    meetingPassword: trimOrNull(input.meetingPassword),
    startUrl,
    joinUrl,
  };
}

export function canJoinLiveClass(status: string): boolean {
  return status === "SCHEDULED" || status === "LIVE";
}

export function resolveJoinUrl(meeting: {
  joinUrl?: string | null;
  meetingUrl?: string | null;
}): string | null {
  return trimOrNull(meeting.joinUrl) ?? trimOrNull(meeting.meetingUrl);
}
