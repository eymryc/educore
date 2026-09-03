"use client";

import { useEffect, useMemo, useState } from "react";
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
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import { ContentTabs } from "@/presentation/components/shared/ContentTabs";
import { useClientDataTable } from "@/presentation/components/shared/data-table-utils";
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

type Tab = "announcements" | "messages";

function announcementTone(
  status: AnnouncementStatus
): "success" | "warning" | "neutral" | "info" {
  if (status === "PUBLISHED") return "success";
  if (status === "ARCHIVED") return "neutral";
  return "warning";
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = value.slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function TargetChips({ targets }: { targets: AnnouncementTarget[] | undefined }) {
  if (!targets?.length) {
    return (
      <span className="text-[12px] text-on-surface-variant">Sans cible</span>
    );
  }
  return (
    <div className="flex flex-wrap gap-xs">
      {targets.map((t, i) => {
        const label = ANNOUNCEMENT_TARGET_LABELS[t.target_type] ?? t.target_type;
        const text = t.target_id != null ? `${label} #${t.target_id}` : label;
        return (
          <span
            key={`${t.target_type}-${t.target_id ?? "all"}-${i}`}
            className="inline-flex items-center h-6 px-sm text-[11px] font-medium bg-secondary-fixed text-on-secondary-fixed"
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
  const [tab, setTab] = useState<Tab>("announcements");
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

  const canCreate = can(user, "communication.create");
  const canUpdate = can(user, "communication.update");
  const canDelete = can(user, "communication.delete");

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

  const filteredAnnouncements = useMemo(
    () => filterAnnouncements(announcements, { search, status: statusFilter }),
    [announcements, search, statusFilter]
  );

  const announcementsTable = useClientDataTable(filteredAnnouncements, [
    search,
    statusFilter,
    tab,
  ]);

  const filteredConversations = useMemo(
    () => filterConversations(conversations, { search, type: typeFilter }),
    [conversations, search, typeFilter]
  );

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  async function openConversation(conversation: Conversation) {
    setSelectedId(conversation.id);
    setThreadLoading(true);
    setError(null);
    try {
      const [detail, msgs] = await Promise.all([
        getConversation(conversation.id),
        listMessages(conversation.id),
      ]);
      setConversations((prev) =>
        prev.map((c) => (c.id === detail.id ? { ...c, ...detail } : c))
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

  const createLabel =
    tab === "announcements" ? "Nouvelle annonce" : "Nouvelle conversation";
  const createResource =
    tab === "announcements" ? "communication" : "conversations";
  const searchPlaceholder =
    tab === "announcements" ? "Titre ou contenu…" : "Participant, sujet…";
  const searchLabel =
    tab === "announcements" ? "Rechercher annonces" : "Rechercher conversations";

  return (
    <div
      className={`flex flex-col w-full mx-auto gap-md ${
        tab === "messages"
          ? "h-[calc(100vh-7.5rem)] max-w-[1600px] pb-md"
          : "max-w-7xl gap-lg pb-xl"
      }`}
      data-testid="communication-panel"
    >
      {notice && (
        <div
          className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm shrink-0"
          role="status"
        >
          {notice}
        </div>
      )}
      {error && (
        <div
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm shrink-0"
          data-testid="communication-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div
        className={`ui-table-shell flex flex-col !mt-0 ${
          tab === "messages" ? "flex-1 min-h-0 overflow-hidden" : ""
        }`}
      >
        <ContentTabs
          items={[
            {
              id: "announcements",
              label: "Annonces",
              count: announcements.length,
            },
            {
              id: "messages",
              label: "Messages",
              count: conversations.length,
            },
          ]}
          onChange={(id) => {
            setTab(id);
            setSearch("");
            setStatusFilter("");
            setTypeFilter("");
          }}
          testId="communication-tabs"
          value={tab}
        />

        <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15 shrink-0">
          <div className="ui-search-field flex-1 min-w-[200px] h-10 py-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              aria-label={searchLabel}
              className="ui-search-input ml-sm h-full"
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              type="text"
              value={search}
            />
          </div>
          {tab === "announcements" && (
            <select
              aria-label="Filtrer par statut"
              className="ui-input cursor-pointer h-10 py-0"
              onChange={(e) => setStatusFilter(e.target.value)}
              value={statusFilter}
            >
              <option value="">Tous les statuts</option>
              {(Object.keys(ANNOUNCEMENT_STATUS_LABELS) as AnnouncementStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {ANNOUNCEMENT_STATUS_LABELS[s]}
                  </option>
                )
              )}
            </select>
          )}
          {tab === "messages" && (
            <select
              aria-label="Filtrer par type"
              className="ui-input cursor-pointer h-10 py-0"
              onChange={(e) => setTypeFilter(e.target.value)}
              value={typeFilter}
            >
              <option value="">Tous les types</option>
              {(Object.keys(CONVERSATION_TYPE_LABELS) as ConversationType[]).map(
                (t) => (
                  <option key={t} value={t}>
                    {CONVERSATION_TYPE_LABELS[t]}
                  </option>
                )
              )}
            </select>
          )}
          <div className="ml-auto shrink-0 flex items-center gap-sm">
            <DataTableRefreshButton
              loading={loading}
              onRefresh={() => void reload()}
            />
            {canCreate && (
              <CrudCreateLink
                className="inline-flex items-center gap-sm h-10 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"
                label={createLabel}
                resource={createResource}
              />
            )}
          </div>
        </div>

        {tab === "announcements" && (
          <>
            <div
              className="flex-1 min-h-[320px] overflow-y-auto p-md bg-surface-container-low/40 space-y-sm"
              data-testid="announcements-table"
            >
              {loading ? (
                <ContentSkeleton testId="communication-loading" variant="list" />
              ) : filteredAnnouncements.length === 0 ? (
                <div className="min-h-[240px] flex flex-col items-center justify-center gap-sm border border-dashed border-outline-variant/50 bg-surface-container-lowest px-md py-xl text-center">
                  <span
                    aria-hidden
                    className="material-symbols-outlined text-on-surface-variant/50 text-[32px]"
                  >
                    campaign
                  </span>
                  <p className="font-body-sm text-on-surface-variant">
                    Aucune annonce.
                  </p>
                </div>
              ) : (
                announcementsTable.pageRows.map((a) => (
                  <article
                    key={a.id}
                    className={`flex gap-md p-md bg-surface-container-lowest border border-outline-variant/25 shadow-sm ${
                      a.is_pinned ? "border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <div
                      className={`w-11 h-11 shrink-0 flex items-center justify-center ${
                        a.status === "PUBLISHED"
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      <span
                        aria-hidden
                        className="material-symbols-outlined text-[22px]"
                      >
                        {a.is_pinned ? "push_pin" : "campaign"}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col gap-sm">
                      <div className="flex items-start gap-sm">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-[15px] text-on-surface leading-snug">
                            {a.title}
                          </h3>
                          <p className="font-body-sm text-on-surface-variant mt-xs line-clamp-2">
                            {a.body}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-sm">
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

                      <div className="flex flex-wrap items-center gap-sm justify-between">
                        <TargetChips targets={a.targets} />
                        {(a.published_at || a.created_at) && (
                          <span className="inline-flex items-center gap-xs text-[11px] text-on-surface-variant tabular-nums">
                            <span
                              aria-hidden
                              className="material-symbols-outlined text-[14px]"
                            >
                              calendar_today
                            </span>
                            {formatDate(a.published_at ?? a.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            {!loading && filteredAnnouncements.length > 0 && (
              <DataTablePagination
                canNextPage={announcementsTable.canNextPage}
                canPreviousPage={announcementsTable.canPreviousPage}
                entityLabel="annonces"
                from={announcementsTable.from}
                onFirstPage={() => announcementsTable.setPageIndex(0)}
                onLastPage={() =>
                  announcementsTable.setPageIndex(
                    announcementsTable.pageCount - 1
                  )
                }
                onNextPage={() =>
                  announcementsTable.setPageIndex(
                    announcementsTable.pageIndex + 1
                  )
                }
                onPageChange={announcementsTable.setPageIndex}
                onPageSizeChange={announcementsTable.setPageSize}
                onPreviousPage={() =>
                  announcementsTable.setPageIndex(
                    announcementsTable.pageIndex - 1
                  )
                }
                pageCount={announcementsTable.pageCount}
                pageIndex={announcementsTable.pageIndex}
                pageSize={announcementsTable.pageSize}
                testId="announcements-pagination"
                to={announcementsTable.to}
                total={filteredAnnouncements.length}
              />
            )}
          </>
        )}

        {tab === "messages" && (
          <div
            className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden"
            data-testid="messages-panel"
          >
            <div className="lg:col-span-4 flex flex-col min-h-0 border-r border-outline-variant/15 bg-surface-container-lowest">
              <div
                className="flex-1 overflow-y-auto"
                data-testid="conversations-list"
              >
                {loading ? (
                  <ContentSkeleton testId="communication-loading" variant="list" />
                ) : filteredConversations.length === 0 ? (
                  <p className="p-lg font-body-sm text-on-surface-variant text-center">
                    Aucune conversation.
                  </p>
                ) : (
                  filteredConversations.map((c) => {
                    const active = selectedId === c.id;
                    const title = conversationTitle(c, user?.id);
                    const initials = title
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase() ?? "")
                      .join("");
                    return (
                      <button
                        key={c.id}
                        className={`w-full text-left px-md py-md flex gap-sm border-b border-outline-variant/15 transition-colors ${
                          active
                            ? "bg-secondary-fixed/50 border-l-4 border-l-primary"
                            : "hover:bg-surface-container-low border-l-4 border-l-transparent"
                        }`}
                        onClick={() => void openConversation(c)}
                        type="button"
                      >
                        <div
                          className={`w-10 h-10 shrink-0 flex items-center justify-center text-[12px] font-semibold ${
                            active
                              ? "bg-primary text-on-primary"
                              : "bg-surface-container-high text-on-surface"
                          }`}
                        >
                          {initials || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-sm">
                            <span className="font-semibold text-[13px] truncate">
                              {title}
                            </span>
                            <span className="font-label-caps text-[10px] text-on-surface-variant shrink-0">
                              {CONVERSATION_TYPE_LABELS[c.type]}
                            </span>
                          </div>
                          <p className="font-body-sm text-on-surface-variant mt-xs line-clamp-1 text-[12px]">
                            {latestMessagePreview(c)}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div
              className="lg:col-span-8 flex flex-col min-h-[320px] lg:min-h-0 bg-surface-container-low/30"
              data-testid="message-thread"
            >
              {!selectedId ? (
                <div className="m-auto flex flex-col items-center gap-sm p-lg text-center">
                  <span
                    aria-hidden
                    className="material-symbols-outlined text-on-surface-variant/40 text-[40px]"
                  >
                    forum
                  </span>
                  <p className="font-body-md text-on-surface-variant">
                    Sélectionnez une conversation.
                  </p>
                </div>
              ) : (
                <>
                  <div className="px-lg py-md border-b border-outline-variant/15 bg-surface-container-lowest shrink-0">
                    <h2 className="font-title-sm text-[15px]">
                      {selected ? conversationTitle(selected, user?.id) : "…"}
                    </h2>
                    {selected && (
                      <p className="text-[12px] text-on-surface-variant mt-xs">
                        {CONVERSATION_TYPE_LABELS[selected.type]}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-md flex flex-col gap-sm">
                    {threadLoading ? (
                      <PanelSkeleton label="Chargement des messages…" />
                    ) : messages.length === 0 ? (
                      <p className="font-body-sm text-on-surface-variant m-auto">
                        Aucun message.
                      </p>
                    ) : (
                      messages.map((m) => {
                        const mine =
                          user?.id != null && m.sender_id === user.id;
                        return (
                          <div
                            key={m.id}
                            className={`max-w-[80%] px-md py-sm shadow-sm ${
                              mine
                                ? "self-end bg-primary text-on-primary"
                                : "self-start bg-surface-container-lowest border border-outline-variant/20"
                            }`}
                          >
                            {!mine && (
                              <div className="font-label-caps text-[10px] text-on-surface-variant mb-xs">
                                {m.sender?.name ?? `User #${m.sender_id}`}
                              </div>
                            )}
                            <p className="font-body-sm whitespace-pre-wrap">
                              {m.body}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="p-md border-t border-outline-variant/15 bg-surface-container-lowest flex gap-sm shrink-0">
                    <textarea
                      aria-label="Nouveau message"
                      className="flex-1 ui-input py-sm px-md font-body-sm min-h-[72px] resize-none"
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Écrire un message…"
                      value={draft}
                    />
                    <button
                      className="px-md py-sm h-10 self-end bg-primary text-on-primary font-label-caps text-label-caps disabled:opacity-40 inline-flex items-center gap-xs"
                      disabled={busy || !draft.trim()}
                      onClick={() => void handleSend()}
                      type="button"
                    >
                      <span
                        aria-hidden
                        className="material-symbols-outlined text-[18px]"
                      >
                        send
                      </span>
                      Envoyer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
