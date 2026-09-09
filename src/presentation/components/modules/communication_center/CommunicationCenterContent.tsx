"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
} from "@/presentation/components/shared/DataTableActionsMenu";
import { DataTableRefreshButton } from "@/presentation/components/shared/DataTableControls";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  ContentSkeleton,
  PanelSkeleton,
} from "@/presentation/components/shared/DataTableSkeleton";
import {
  DataTableShell,
  DataTableSearch,
  DataTableEmpty,
  DataTableFilterSelect,
} from "@/presentation/components/shared/DataTable";
import {
  deleteAnnouncement,
  getConversation,
  listAnnouncements,
  listConversations,
  listMessages,
  markConversationRead,
  publishAnnouncement,
  sendMessage,
} from "@/infrastructure/api/resources/communication";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  ANNOUNCEMENT_STATUS_LABELS,
  ANNOUNCEMENT_TARGET_LABELS,
  CONVERSATION_TYPE_LABELS,
  canEditAnnouncement,
  canPublishAnnouncement,
  conversationTitle,
  filterAnnouncements,
  filterConversations,
  latestMessagePreview,
  type Announcement,
  type AnnouncementStatus,
  type AnnouncementTarget,
  type Conversation,
  type ConversationType,
  type Message,
} from "@/shared/types/communication.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

type InboxKind = "announcements" | "conversation";

const ANNOUNCE_BATCH = 6;
const ANNOUNCE_LOAD_MS = 900;

const AVATAR_TONES = [
  "bg-[#00A884] text-white",
  "bg-[#53BDEB] text-[#052e22]",
  "bg-[#7C5CFC] text-white",
  "bg-[#FF8A00] text-white",
  "bg-[#E85D75] text-white",
  "bg-[#128C7E] text-white",
];

const CHAT_WALLPAPER = {
  backgroundColor: "#efeae2",
  backgroundImage:
    "radial-gradient(circle at 1px 1px, rgb(15 23 42 / 0.06) 1px, transparent 0)",
  backgroundSize: "22px 22px",
};

function announcementTone(
  status: AnnouncementStatus
): "success" | "warning" | "neutral" | "info" {
  if (status === "PUBLISHED") return "success";
  if (status === "ARCHIVED") return "neutral";
  return "warning";
}

function initialsFrom(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function avatarTone(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash + char.charCodeAt(0)) % AVATAR_TONES.length;
  return AVATAR_TONES[hash] ?? AVATAR_TONES[0]!;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatListTime(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) return "";
  const now = new Date();
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = start(now) - start(date);
  if (diff === 0) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diff === 86_400_000) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatBubbleTime(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) return "";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function messageDayLabel(value: string | null | undefined): string | null {
  const date = parseDate(value);
  if (!date) return null;
  const now = new Date();
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = start(now) - start(date);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 86_400_000) return "Hier";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function conversationUnread(conversation: Conversation, userId?: number | null): boolean {
  const last =
    conversation.latest_message ??
    conversation.messages?.[conversation.messages.length - 1];
  if (!last || userId == null || last.sender_id === userId) return false;
  const me = conversation.participants?.find((p) => p.user_id === userId);
  if (!me) return false;
  if (!me.last_read_at) return true;
  if (!last.created_at) return false;
  const lastAt = parseDate(last.created_at);
  const readAt = parseDate(me.last_read_at);
  if (!lastAt || !readAt) return false;
  return lastAt.getTime() > readAt.getTime();
}

function ChatAvatar({
  name,
  group = false,
  size = "md",
}: {
  name: string;
  group?: boolean;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "w-8 h-8 text-[11px]" : "w-11 h-11 text-[13px]";
  if (group) {
    return (
      <span
        className={`${dim} rounded-[50%] shrink-0 inline-flex items-center justify-center bg-[#00A884] text-white`}
      >
        <span aria-hidden className="material-symbols-outlined text-[18px]">
          groups
        </span>
      </span>
    );
  }
  return (
    <span
      className={`${dim} rounded-[50%] shrink-0 inline-flex items-center justify-center font-semibold ${avatarTone(name)}`}
    >
      {initialsFrom(name)}
    </span>
  );
}

function TargetChips({ targets }: { targets: AnnouncementTarget[] | undefined }) {
  if (!targets?.length) {
    return <span className="text-[12px] text-on-surface-variant">Sans cible</span>;
  }
  return (
    <div className="flex flex-wrap gap-xs">
      {targets.map((t, i) => {
        const label = ANNOUNCEMENT_TARGET_LABELS[t.target_type] ?? t.target_type;
        const text = t.target_id != null ? `${label} #${t.target_id}` : label;
        return (
          <span
            className="inline-flex items-center h-6 px-sm text-[11px] font-medium bg-[#e7f7ef] text-[#0b6b4a]"
            key={`${t.target_type}-${t.target_id ?? "all"}-${i}`}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
}

export function CommunicationCenterContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const threadEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const announceScrollRef = useRef<HTMLDivElement>(null);
  const announceSentinelRef = useRef<HTMLDivElement>(null);
  const announceLoadingMoreRef = useRef(false);
  const [inboxKind, setInboxKind] = useState<InboxKind>("announcements");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [mobilePane, setMobilePane] = useState(false);
  const [announceVisible, setAnnounceVisible] = useState(ANNOUNCE_BATCH);
  const [announceLoadingMore, setAnnounceLoadingMore] = useState(false);

  const canCreate = can(user, "communication.create");
  const canUpdate = can(user, "communication.update");
  const canDelete = can(user, "communication.delete");
  const chatting = inboxKind === "conversation" && selectedId != null;

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [annList, convList] = await Promise.all([
        listAnnouncements(),
        listConversations(),
      ]);
      setAnnouncements(annList);
      setConversations(convList);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView?.({ block: "end" });
  }, [messages, threadLoading, selectedId]);

  const filteredAnnouncements = useMemo(() => {
    const list = filterAnnouncements(announcements, { status: statusFilter });
    return [...list].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));
  }, [announcements, statusFilter]);

  const visibleAnnouncements = filteredAnnouncements.slice(0, announceVisible);
  const hasMoreAnnouncements = announceVisible < filteredAnnouncements.length;

  useEffect(() => {
    setAnnounceVisible(ANNOUNCE_BATCH);
    setAnnounceLoadingMore(false);
    announceLoadingMoreRef.current = false;
  }, [statusFilter, announcements.length]);

  useEffect(() => {
    if (inboxKind !== "announcements" || !hasMoreAnnouncements) return;
    const root = announceScrollRef.current;
    const sentinel = announceSentinelRef.current;
    if (!root || !sentinel) return;

    let cancelled = false;
    let timer = 0;

    const loadMore = () => {
      if (cancelled || announceLoadingMoreRef.current) return;
      announceLoadingMoreRef.current = true;
      setAnnounceLoadingMore(true);
      timer = window.setTimeout(() => {
        if (cancelled) return;
        setAnnounceVisible((n) => n + ANNOUNCE_BATCH);
        announceLoadingMoreRef.current = false;
        setAnnounceLoadingMore(false);
      }, ANNOUNCE_LOAD_MS);
    };

    if (typeof IntersectionObserver === "undefined") {
      const onScroll = () => {
        if (root.scrollHeight - root.scrollTop - root.clientHeight < 96) loadMore();
      };
      root.addEventListener("scroll", onScroll);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
        root.removeEventListener("scroll", onScroll);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { root, rootMargin: "120px 0px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [inboxKind, hasMoreAnnouncements, announceVisible, filteredAnnouncements.length, loading]);

  const filteredConversations = useMemo(
    () => filterConversations(conversations, { search, type: typeFilter }),
    [conversations, search, typeFilter]
  );

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const selectedTitle = selected ? conversationTitle(selected, user?.id) : "";
  const latestAnnouncement = useMemo(() => {
    return [...announcements].sort((a, b) => {
      const aTime = parseDate(a.published_at ?? a.created_at)?.getTime() ?? 0;
      const bTime = parseDate(b.published_at ?? b.created_at)?.getTime() ?? 0;
      return bTime - aTime;
    })[0];
  }, [announcements]);

  function openAnnouncements() {
    setInboxKind("announcements");
    setSelectedId(null);
    setMobilePane(true);
  }

  function resizeComposer() {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  async function openConversation(conversation: Conversation) {
    setInboxKind("conversation");
    setSelectedId(conversation.id);
    setMobilePane(true);
    setThreadLoading(true);
    setError(null);
    try {
      const [detail, msgs] = await Promise.all([
        getConversation(conversation.id),
        listMessages(conversation.id),
      ]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === detail.id
            ? {
                ...c,
                ...detail,
                participants: (detail.participants ?? c.participants)?.map((p) =>
                  p.user_id === user?.id
                    ? { ...p, last_read_at: new Date().toISOString() }
                    : p
                ),
              }
            : c
        )
      );
      setMessages(msgs);
      await markConversationRead(conversation.id);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setThreadLoading(false);
    }
  }

  async function handlePublish(row: Announcement) {
    if (!canUpdate || !canPublishAnnouncement(row.status)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await publishAnnouncement(row.id);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
      setNotice("Annonce publiée.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAnnouncement(row: Announcement) {
    if (!canDelete) return;
    if (
      !(await confirmDialog(`Supprimer l'annonce « ${row.title} » ?`, {
        destructive: true,
      }))
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await deleteAnnouncement(row.id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== row.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSend() {
    if (!selectedId || !draft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const msg = await sendMessage(selectedId, draft.trim());
      setMessages((prev) => [...prev, msg]);
      setDraft("");
      requestAnimationFrame(() => {
        if (composerRef.current) {
          composerRef.current.style.height = "auto";
        }
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? { ...c, latest_message: msg, messages: [msg] }
            : c
        )
      );
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const listHidden = mobilePane ? "hidden lg:flex" : "flex";
  const paneHidden = mobilePane ? "flex" : "hidden lg:flex";

  return (
    <div
      className="flex flex-col w-full min-w-0 h-[calc(100vh-8rem)] max-w-none"
      data-testid="communication-panel"
    >
      {notice && (
        <div
          className="flex items-start gap-sm bg-secondary-container text-on-secondary-container px-md py-sm font-body-sm shrink-0 mb-sm"
          role="status"
        >
          <span aria-hidden className="material-symbols-outlined text-[18px] shrink-0">
            check_circle
          </span>
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div
          className="flex items-start gap-sm bg-error-container text-on-error-container px-md py-sm font-body-sm shrink-0 mb-sm"
          data-testid="communication-error"
          role="alert"
        >
          <span aria-hidden className="material-symbols-outlined text-[18px] shrink-0">
            error
          </span>
          <span>{error}</span>
        </div>
      )}

      <DataTableShell className="mt-0 flex-1 min-h-0 flex flex-col">
        <div
          className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[22rem_minmax(0,1fr)] overflow-hidden"
          data-testid="messages-panel"
        >
          <div
            className={`flex-col min-h-0 border-r border-outline-variant/15 bg-white ${listHidden}`}
          >
            <div className="px-md py-sm bg-[#f0f2f5] border-b border-outline-variant/15 shrink-0 flex items-center gap-sm">
              <ChatAvatar name={user?.name ?? "Moi"} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[14px] truncate">Messagerie</p>
                <p className="text-[11px] text-on-surface-variant">
                  Canal d&apos;annonces et discussions
                </p>
              </div>
              <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
              {canCreate && (
                <CrudCreateLink
                  className="inline-flex items-center justify-center w-9 h-9 bg-white text-on-surface hover:bg-surface-container-low overflow-hidden [font-size:0]"
                  icon="edit_square"
                  label="Nouvelle conversation"
                  resource="conversations"
                />
              )}
            </div>

            <div className="px-sm py-sm bg-white border-b border-outline-variant/10 shrink-0 flex flex-col gap-sm">
              <DataTableSearch
                ariaLabel="Rechercher conversations"
                onChange={setSearch}
                placeholder="Rechercher une discussion…"
                value={search}
              />
              <DataTableFilterSelect
                ariaLabel="Filtrer par type"
                className="w-full"
                onChange={setTypeFilter}
                options={(Object.keys(CONVERSATION_TYPE_LABELS) as ConversationType[]).map(
                  (t) => ({ value: t, label: CONVERSATION_TYPE_LABELS[t] })
                )}
                placeholder="Tous les types"
                value={typeFilter}
              />
            </div>

            <div className="flex-1 overflow-y-auto" data-testid="conversations-list">
              <button
                className={`w-full text-left px-md py-[11px] flex gap-sm border-b border-outline-variant/10 ${
                  inboxKind === "announcements" ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"
                }`}
                onClick={openAnnouncements}
                type="button"
              >
                <span className="w-11 h-11 rounded-[50%] shrink-0 inline-flex items-center justify-center bg-[#00A884] text-white">
                  <span aria-hidden className="material-symbols-outlined text-[22px]">
                    campaign
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-sm">
                    <span className="font-semibold text-[15px] truncate">Annonces</span>
                    <span className="text-[11px] text-on-surface-variant tabular-nums shrink-0">
                      {formatListTime(
                        latestAnnouncement?.published_at ?? latestAnnouncement?.created_at
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-sm mt-0.5">
                    <p className="min-w-0 flex-1 line-clamp-1 text-[13px] text-on-surface-variant">
                      {latestAnnouncement?.title ?? "Canal officiel de l'établissement"}
                    </p>
                    {announcements.length > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-[50%] bg-[#25D366] text-white text-[10px] font-bold inline-flex items-center justify-center shrink-0">
                        {announcements.length > 99 ? "99+" : announcements.length}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              <p className="px-md pt-sm pb-xs text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Discussions
              </p>

              {loading ? (
                <ContentSkeleton testId="communication-loading" variant="list" />
              ) : filteredConversations.length === 0 ? (
                <p className="px-md py-md text-[13px] text-on-surface-variant">
                  Aucune conversation.
                  {canCreate ? " Écrivez à un collègue ou une famille." : ""}
                </p>
              ) : (
                filteredConversations.map((c) => {
                  const active = chatting && selectedId === c.id;
                  const title = conversationTitle(c, user?.id);
                  const unread = conversationUnread(c, user?.id);
                  const stamp = formatListTime(
                    c.latest_message?.created_at ?? c.updated_at ?? c.created_at
                  );
                  return (
                    <button
                      className={`w-full text-left px-md py-[11px] flex gap-sm border-b border-outline-variant/10 ${
                        active ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"
                      }`}
                      key={c.id}
                      onClick={() => void openConversation(c)}
                      type="button"
                    >
                      <ChatAvatar group={c.type === "GROUP"} name={title} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-sm">
                          <span
                            className={`truncate text-[15px] ${unread ? "font-bold" : "font-semibold"}`}
                          >
                            {title}
                          </span>
                          <span
                            className={`text-[11px] shrink-0 tabular-nums ${
                              unread ? "text-[#00A884] font-semibold" : "text-on-surface-variant"
                            }`}
                          >
                            {stamp}
                          </span>
                        </div>
                        <div className="flex items-center gap-sm mt-0.5">
                          <p
                            className={`min-w-0 flex-1 line-clamp-1 text-[13px] ${
                              unread ? "text-on-surface font-medium" : "text-on-surface-variant"
                            }`}
                          >
                            {latestMessagePreview(c)}
                          </p>
                          {unread && (
                            <span className="min-w-[18px] h-[18px] px-1 rounded-[50%] bg-[#25D366] text-white text-[10px] font-bold inline-flex items-center justify-center shrink-0">
                              1
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className={`flex-col min-h-[320px] lg:min-h-0 ${paneHidden}`}>
            {inboxKind === "announcements" ? (
              <>
                <div className="px-sm sm:px-md py-sm bg-[#f0f2f5] border-b border-outline-variant/15 shrink-0 flex items-center gap-sm">
                  <button
                    aria-label="Retour aux discussions"
                    className="lg:hidden w-9 h-9 inline-flex items-center justify-center text-on-surface"
                    onClick={() => setMobilePane(false)}
                    type="button"
                  >
                    <span aria-hidden className="material-symbols-outlined text-[22px]">
                      arrow_back
                    </span>
                  </button>
                  <span className="w-11 h-11 rounded-[50%] shrink-0 inline-flex items-center justify-center bg-[#00A884] text-white">
                    <span aria-hidden className="material-symbols-outlined text-[22px]">
                      campaign
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-[15px]">Annonces</h2>
                    <p className="text-[12px] text-on-surface-variant truncate">
                      Canal officiel · {announcements.length} publication
                      {announcements.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <DataTableFilterSelect
                    ariaLabel="Filtrer par statut"
                    className="min-w-[9rem]"
                    onChange={setStatusFilter}
                    options={(Object.keys(ANNOUNCEMENT_STATUS_LABELS) as AnnouncementStatus[]).map(
                      (s) => ({ value: s, label: ANNOUNCEMENT_STATUS_LABELS[s] })
                    )}
                    placeholder="Tous les statuts"
                    value={statusFilter}
                  />
                </div>

                <div
                  className="flex-1 overflow-y-auto px-md py-md"
                  data-testid="announcements-table"
                  ref={announceScrollRef}
                  style={CHAT_WALLPAPER}
                >
                  {loading ? (
                    <ContentSkeleton testId="communication-loading" variant="list" />
                  ) : filteredAnnouncements.length === 0 ? (
                    <DataTableEmpty
                      description={
                        statusFilter
                          ? "Aucune annonce ne correspond à ce statut."
                          : "Publiez un communiqué pour informer les familles et l'équipe."
                      }
                      icon="campaign"
                      title="Aucune annonce."
                    />
                  ) : (
                    <div className="max-w-xl mx-auto flex flex-col gap-md">
                      {visibleAnnouncements.map((a) => (
                        <article
                          className={`bg-white shadow-[0_1px_0.5px_rgb(11_20_26/0.13)] rounded-[8px] overflow-hidden ${
                            a.is_pinned ? "ring-1 ring-[#00A884]/40" : ""
                          }`}
                          key={a.id}
                        >
                          <div className="px-md pt-md pb-sm flex items-start gap-sm">
                            <span className="w-9 h-9 rounded-[50%] shrink-0 inline-flex items-center justify-center bg-[#00A884] text-white">
                              <span aria-hidden className="material-symbols-outlined text-[18px]">
                                {a.is_pinned ? "push_pin" : "campaign"}
                              </span>
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-sm">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-[15px] text-[#111b21] leading-snug">
                                    {a.title}
                                  </h3>
                                  <p className="text-[12px] text-[#667781] mt-0.5">
                                    {a.author?.name ?? "Établissement"}
                                    {(a.published_at || a.created_at) && (
                                      <>
                                        {" · "}
                                        {formatListTime(a.published_at ?? a.created_at)}
                                      </>
                                    )}
                                  </p>
                                </div>
                                <div className="shrink-0 flex items-center gap-xs">
                                  <StatusBadge
                                    label={ANNOUNCEMENT_STATUS_LABELS[a.status]}
                                    tone={announcementTone(a.status)}
                                    withDot
                                  />
                                  <DataTableActionsMenu
                                    ariaLabel={`Actions pour ${a.title}`}
                                    items={[
                                      ...(canUpdate && canPublishAnnouncement(a.status)
                                        ? [
                                            {
                                              kind: "button" as const,
                                              label: "Publier",
                                              icon: "campaign",
                                              onClick: () => void handlePublish(a),
                                              disabled: busy,
                                            },
                                          ]
                                        : []),
                                      ...crudRowActions({
                                        edit: canEditAnnouncement(a.status)
                                          ? {
                                              resource: "communication",
                                              recordId: a.id,
                                            }
                                          : undefined,
                                        delete: {
                                          onClick: () => void handleDeleteAnnouncement(a),
                                          disabled: busy,
                                        },
                                        canUpdate:
                                          canUpdate && canEditAnnouncement(a.status),
                                        canDelete,
                                      }),
                                    ]}
                                  />
                                </div>
                              </div>
                              <p className="mt-sm text-[14.2px] leading-relaxed text-[#111b21] whitespace-pre-wrap">
                                {a.body}
                              </p>
                              <div className="mt-sm flex flex-wrap items-center justify-between gap-sm">
                                <TargetChips targets={a.targets} />
                                {canUpdate && canPublishAnnouncement(a.status) && (
                                  <button
                                    className="h-8 px-sm bg-[#00A884] text-white text-[12px] font-semibold"
                                    disabled={busy}
                                    onClick={() => void handlePublish(a)}
                                    type="button"
                                  >
                                    Publier
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                      {hasMoreAnnouncements && (
                        <div
                          className="flex flex-col items-center gap-xs py-md text-[#667781]"
                          ref={announceSentinelRef}
                        >
                          {announceLoadingMore && (
                            <>
                              <span
                                aria-hidden
                                className="material-symbols-outlined text-[22px] animate-spin"
                              >
                                progress_activity
                              </span>
                              <span className="text-[12px]">Chargement des annonces…</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="px-sm py-sm bg-[#f0f2f5] flex items-center gap-sm shrink-0">
                  {canCreate ? (
                    <CrudCreateLink
                      className="flex-1 justify-center inline-flex items-center gap-sm h-11 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-[24px] transition-colors shadow-sm"
                      icon="campaign"
                      label="Nouvelle annonce"
                      resource="communication"
                    />
                  ) : (
                    <p className="flex-1 text-center text-[13px] text-on-surface-variant py-sm">
                      Seule l&apos;administration publie sur ce canal.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col" data-testid="message-thread">
                {threadLoading && !selected ? (
                  <PanelSkeleton label="Chargement des messages…" />
                ) : (
                  <>
                    <div className="px-sm sm:px-md py-sm bg-[#f0f2f5] border-b border-outline-variant/15 shrink-0 flex items-center gap-sm">
                      <button
                        aria-label="Retour aux discussions"
                        className="lg:hidden w-9 h-9 inline-flex items-center justify-center text-on-surface"
                        onClick={() => setMobilePane(false)}
                        type="button"
                      >
                        <span aria-hidden className="material-symbols-outlined text-[22px]">
                          arrow_back
                        </span>
                      </button>
                      <ChatAvatar group={selected?.type === "GROUP"} name={selectedTitle} />
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-[15px] truncate">
                          {selectedTitle || "…"}
                        </h2>
                        {selected && (
                          <p className="text-[12px] text-on-surface-variant truncate">
                            {selected.type === "GROUP"
                              ? `${selected.participants?.length ?? 0} participants`
                              : CONVERSATION_TYPE_LABELS[selected.type]}
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex-1 overflow-y-auto px-md py-md flex flex-col gap-xs"
                      style={CHAT_WALLPAPER}
                    >
                      {threadLoading ? (
                        <PanelSkeleton label="Chargement des messages…" />
                      ) : messages.length === 0 ? (
                        <p className="font-body-sm text-on-surface-variant m-auto bg-white/80 px-md py-sm">
                          Aucun message.
                        </p>
                      ) : (
                        messages.map((m, index) => {
                          const mine = user?.id != null && m.sender_id === user.id;
                          const day = messageDayLabel(m.created_at);
                          const prevDay = messageDayLabel(messages[index - 1]?.created_at);
                          const showDay = Boolean(day && day !== prevDay);
                          const time = formatBubbleTime(m.created_at);
                          return (
                            <div className="contents" key={m.id}>
                              {showDay && (
                                <div className="self-center my-sm">
                                  <span className="inline-block px-sm py-xs bg-white/90 text-[11px] text-[#667781] shadow-sm">
                                    {day}
                                  </span>
                                </div>
                              )}
                              <div
                                className={`max-w-[78%] px-sm pt-sm pb-xs shadow-[0_1px_0.5px_rgb(11_20_26/0.13)] ${
                                  mine
                                    ? "self-end bg-[#d9fdd3] text-[#111b21] rounded-[8px] rounded-br-[2px]"
                                    : "self-start bg-white text-[#111b21] rounded-[8px] rounded-bl-[2px]"
                                }`}
                              >
                                {!mine && (
                                  <div className="font-semibold text-[12px] text-[#00A884] mb-0.5">
                                    {m.sender?.name ?? `User #${m.sender_id}`}
                                  </div>
                                )}
                                <p className="font-body-sm text-[14.2px] leading-snug whitespace-pre-wrap">
                                  {m.body}
                                </p>
                                <div className="flex items-center justify-end gap-xs mt-0.5 text-[#667781]">
                                  {time && (
                                    <span className="text-[11px] tabular-nums leading-none">
                                      {time}
                                    </span>
                                  )}
                                  {mine && (
                                    <span
                                      aria-hidden
                                      className="material-symbols-outlined text-[16px] text-[#53bdeb] leading-none"
                                    >
                                      done_all
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={threadEndRef} />
                    </div>

                    <form
                      className="px-sm py-sm bg-[#f0f2f5] flex items-end gap-sm shrink-0"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleSend();
                      }}
                    >
                      <div className="flex-1 min-w-0 bg-white rounded-[24px] px-md py-[7px] flex items-end">
                        <textarea
                          aria-label="Nouveau message"
                          className="w-full bg-transparent border-none outline-none resize-none font-body-sm text-[15px] text-on-surface min-h-[24px] max-h-[120px] leading-snug py-[3px]"
                          onChange={(e) => {
                            setDraft(e.target.value);
                            resizeComposer();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              void handleSend();
                            }
                          }}
                          placeholder="Écrire un message…"
                          ref={composerRef}
                          rows={1}
                          value={draft}
                        />
                      </div>
                      <button
                        aria-label="Envoyer"
                        className="w-11 h-11 rounded-[50%] bg-[#00A884] text-white inline-flex items-center justify-center shrink-0 disabled:opacity-40 shadow-sm hover:bg-[#00957a] transition-colors"
                        disabled={busy || !draft.trim()}
                        type="submit"
                      >
                        <span aria-hidden className="material-symbols-outlined text-[22px]">
                          send
                        </span>
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </DataTableShell>
    </div>
  );
}
