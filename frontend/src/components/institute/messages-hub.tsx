"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchInbox,
  fetchMessage,
  fetchSentMessages,
  markMessageRead,
  sendMessage,
} from "@/lib/messages-api";
import { fetchComposeTargets } from "@/lib/messages-api";
import type { MessageItem } from "@/types/institute";
import type { Role } from "@/types/auth";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

interface MessagesHubProps {
  role: Role;
}

export function MessagesHub({ role }: MessagesHubProps) {
  const { success, error: toastError } = useToast();
  const [tab, setTab] = useState<"inbox" | "sent" | "compose">("inbox");
  const [inbox, setInbox] = useState<MessageItem[]>([]);
  const [sent, setSent] = useState<MessageItem[]>([]);
  const [selected, setSelected] = useState<MessageItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [canBroadcast, setCanBroadcast] = useState(false);
  const [compose, setCompose] = useState({
    subject: "",
    content: "",
    recipientIds: [] as string[],
    batchId: "",
    broadcastAllStudents: false,
    type: "GENERAL",
  });
  const [recipients, setRecipients] = useState<{ value: string; label: string }[]>([]);
  const [batches, setBatches] = useState<{ value: string; label: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inboxRes, sentRes] = await Promise.all([fetchInbox(), fetchSentMessages()]);
      setInbox(inboxRes.data);
      setSent(sentRes.data);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load messages"));
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchComposeTargets();
        setRecipients(
          res.data.recipients.map((r) => ({
            value: r.id,
            label: `${r.name} (${r.role})${r.batchName ? ` · ${r.batchName}` : ""}`,
          })),
        );
        setBatches(res.data.batches.map((b) => ({ value: b.id, label: b.name })));
        setCanBroadcast(res.data.canBroadcastAllStudents);
      } catch {
        /* optional */
      }
    })();
  }, [role]);

  async function openMessage(id: string) {
    try {
      const res = await fetchMessage(id);
      setSelected(res.data);
      if (!res.data.isRead) {
        await markMessageRead(id);
        void load();
      }
    } catch (err) {
      toastError(formatApiError(err, "Could not open message"));
    }
  }

  async function handleSend() {
    try {
      await sendMessage({
        subject: compose.subject,
        content: compose.content,
        type: compose.type,
        recipientIds: compose.recipientIds.length ? compose.recipientIds : undefined,
        batchId: compose.batchId || undefined,
        broadcastAllStudents: compose.broadcastAllStudents || undefined,
      });
      success("Message sent");
      setCompose({
        subject: "",
        content: "",
        recipientIds: [],
        batchId: "",
        broadcastAllStudents: false,
        type: "GENERAL",
      });
      setTab("sent");
      void load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to send message"));
    }
  }

  const list = tab === "inbox" ? inbox : sent;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card variant="default" className="p-4">
        <div className="flex flex-col gap-2">
          {(["inbox", "sent", "compose"] as const).map((t) => (
            <Button
              key={t}
              variant={tab === t ? "primary" : "ghost"}
              className="justify-start"
              onClick={() => {
                setTab(t);
                setSelected(null);
              }}
            >
              {t === "inbox" ? "Inbox" : t === "sent" ? "Sent" : "Compose"}
            </Button>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        {tab === "compose" ? (
          <Card title="New message" variant="default">
            <div className="space-y-4">
              {canBroadcast && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={compose.broadcastAllStudents}
                    onChange={(e) =>
                      setCompose((c) => ({ ...c, broadcastAllStudents: e.target.checked }))
                    }
                  />
                  Send to all students
                </label>
              )}
              {!compose.broadcastAllStudents && (
                <>
                  {batches.length > 0 && (
                    <Select
                      label="Batch (optional)"
                      options={[{ value: "", label: "— Select batch —" }, ...batches]}
                      value={compose.batchId}
                      onChange={(e) => setCompose((c) => ({ ...c, batchId: e.target.value }))}
                    />
                  )}
                  {recipients.length > 0 && (
                    <Select
                      label="Recipient"
                      options={[{ value: "", label: "— Select —" }, ...recipients]}
                      value={compose.recipientIds[0] ?? ""}
                      onChange={(e) =>
                        setCompose((c) => ({
                          ...c,
                          recipientIds: e.target.value ? [e.target.value] : [],
                        }))
                      }
                    />
                  )}
                </>
              )}
              <Input
                label="Subject"
                value={compose.subject}
                onChange={(e) => setCompose((c) => ({ ...c, subject: e.target.value }))}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  className="min-h-[120px] w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm"
                  value={compose.content}
                  onChange={(e) => setCompose((c) => ({ ...c, content: e.target.value }))}
                />
              </div>
              <Button variant="gold" onClick={() => void handleSend()}>
                Send message
              </Button>
            </div>
          </Card>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Spinner label="Loading messages" />
          </div>
        ) : selected ? (
          <Card variant="default">
            <Button variant="ghost" size="sm" className="mb-4" onClick={() => setSelected(null)}>
              ← Back
            </Button>
            <h2 className="font-serif text-xl font-bold">{selected.subject}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              From {selected.sender.name} · {new Date(selected.createdAt).toLocaleString()}
            </p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{selected.content}</p>
          </Card>
        ) : (
          <Card title={tab === "inbox" ? "Inbox" : "Sent"} variant="default">
            {list.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No messages yet</p>
            ) : (
              <ul className="divide-y divide-border">
                {list.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-4 py-3 text-left text-sm hover:bg-muted/50"
                      onClick={() => void openMessage(m.id)}
                    >
                      <div>
                        <p className={`font-medium ${!m.isRead && tab === "inbox" ? "text-foreground" : ""}`}>
                          {m.subject}
                          {!m.isRead && tab === "inbox" ? (
                            <span className="ml-2 text-xs text-green-700 dark:text-gold-400">New</span>
                          ) : null}
                        </p>
                        <p className="text-muted-foreground">
                          {tab === "inbox" ? m.sender.name : `To ${m.recipientCount} recipient(s)`}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
