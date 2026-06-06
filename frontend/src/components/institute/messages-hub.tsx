"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  SearchableUserSelect,
  type UserSelectOption,
} from "@/components/ui/searchable-user-select";
import {
  fetchInbox,
  fetchMessage,
  fetchSentMessages,
  markMessageRead,
  sendMessage,
  fetchComposeTargets,
} from "@/lib/messages-api";
import type { MessageItem } from "@/types/institute";
import type { Role } from "@/types/auth";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

type SendMode = "individual" | "batch" | "all_students" | "all_teachers";

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
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [canBroadcastStudents, setCanBroadcastStudents] = useState(false);
  const [canBroadcastTeachers, setCanBroadcastTeachers] = useState(false);
  const [sendMode, setSendMode] = useState<SendMode>("individual");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [compose, setCompose] = useState({
    subject: "",
    content: "",
    recipientIds: [] as string[],
    batchId: "",
    type: "GENERAL",
  });
  const [recipientOptions, setRecipientOptions] = useState<UserSelectOption[]>([]);
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

  const loadTargets = useCallback(async () => {
    setTargetsLoading(true);
    try {
      const res = await fetchComposeTargets({
        search: recipientSearch || undefined,
        role: roleFilter || undefined,
      });
      setRecipientOptions(
        res.data.recipients.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.role,
          subtitle: r.batchName,
        })),
      );
      setBatches(
        res.data.batches.map((b) => ({
          value: b.id,
          label: b.status ? `${b.name} (${b.status})` : b.name,
        })),
      );
      setCanBroadcastStudents(res.data.canBroadcastAllStudents);
      setCanBroadcastTeachers(res.data.canBroadcastAllTeachers);
    } catch {
      /* optional */
    } finally {
      setTargetsLoading(false);
    }
  }, [recipientSearch, roleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab !== "compose") return;
    const timer = setTimeout(() => void loadTargets(), recipientSearch ? 300 : 0);
    return () => clearTimeout(timer);
  }, [tab, loadTargets, recipientSearch, roleFilter]);

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
        recipientIds:
          sendMode === "individual" && compose.recipientIds.length
            ? compose.recipientIds
            : undefined,
        batchId: sendMode === "batch" && compose.batchId ? compose.batchId : undefined,
        broadcastAllStudents: sendMode === "all_students" || undefined,
        broadcastAllTeachers: sendMode === "all_teachers" || undefined,
      });
      success("Message sent");
      setCompose({ subject: "", content: "", recipientIds: [], batchId: "", type: "GENERAL" });
      setSendMode("individual");
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
              <div className="space-y-2">
                <p className="text-sm font-medium">Send to</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={sendMode === "individual" ? "primary" : "secondary"}
                    onClick={() => setSendMode("individual")}
                  >
                    Individual
                  </Button>
                  {batches.length > 0 && (
                    <Button
                      size="sm"
                      variant={sendMode === "batch" ? "primary" : "secondary"}
                      onClick={() => setSendMode("batch")}
                    >
                      Entire batch
                    </Button>
                  )}
                  {canBroadcastStudents && (
                    <Button
                      size="sm"
                      variant={sendMode === "all_students" ? "primary" : "secondary"}
                      onClick={() => setSendMode("all_students")}
                    >
                      All students
                    </Button>
                  )}
                  {canBroadcastTeachers && (
                    <Button
                      size="sm"
                      variant={sendMode === "all_teachers" ? "primary" : "secondary"}
                      onClick={() => setSendMode("all_teachers")}
                    >
                      All teachers
                    </Button>
                  )}
                </div>
              </div>

              {sendMode === "individual" && (
                <SearchableUserSelect
                  label="Recipients"
                  options={recipientOptions}
                  value={compose.recipientIds}
                  onChange={(ids) => setCompose((c) => ({ ...c, recipientIds: ids }))}
                  multiple
                  showRoleFilter={role === "ADMIN"}
                  roleFilter={roleFilter}
                  onRoleFilterChange={setRoleFilter}
                  onSearchChange={setRecipientSearch}
                  loading={targetsLoading}
                  placeholder="Search students, teachers, or admins…"
                />
              )}

              {sendMode === "batch" && (
                <Select
                  label="Batch"
                  options={[{ value: "", label: "Select batch…" }, ...batches]}
                  value={compose.batchId}
                  onChange={(e) => setCompose((c) => ({ ...c, batchId: e.target.value }))}
                />
              )}

              {sendMode === "all_students" && (
                <p className="text-sm text-muted-foreground">
                  This message will be sent to every active student account.
                </p>
              )}

              {sendMode === "all_teachers" && (
                <p className="text-sm text-muted-foreground">
                  This message will be sent to every active teacher account.
                </p>
              )}

              {role === "TEACHER" && sendMode === "individual" && (
                <p className="text-xs text-muted-foreground">
                  You can message students in your assigned batches and institute admins only.
                </p>
              )}

              {role === "STUDENT" && (
                <p className="text-xs text-muted-foreground">
                  You can message your assigned teacher and institute admins only.
                </p>
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
                        <p
                          className={`font-medium ${!m.isRead && tab === "inbox" ? "text-foreground" : ""}`}
                        >
                          {m.subject}
                          {!m.isRead && tab === "inbox" ? (
                            <span className="ml-2 text-xs text-green-700 dark:text-gold-400">
                              New
                            </span>
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
